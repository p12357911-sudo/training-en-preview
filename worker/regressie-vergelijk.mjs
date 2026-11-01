// Regressietest: oude en nieuwe worker moeten voor NL-invoer (zonder lang, en met lang:"nl") exact hetzelfde antwoord geven
// en exact dezelfde AI-aanroep doen (systeemprompt + prompt). Mock-AI, geen echte aanroepen.
import fs from 'fs';
import oud from './oud.mjs'; import nieuw from './nieuw.mjs';
const S = JSON.parse(fs.readFileSync('../samples.json', 'utf8'));
let n = 0;
function mkEnv(log, modus) {
  return { ALLOWED_ORIGINS: 'https://p12357911-sudo.github.io', AI: { run: async (model, inv) => {
    log.push(JSON.stringify([model, inv.messages, inv.max_tokens]));
    const p = JSON.parse(inv.messages[1].content.replace('\n/no_think', ''));
    const mk = (id, a, m) => {
      const lek = (m || '').toLowerCase().slice(0, 30);
      const tips = ['Denk aan de deeltjes.', 'Goed!', lek + ' is het antwoord.', 'Denk aan het', 'Kijk naar de temperatuur en de fase waarin de stof zich bevindt.', ''];
      const verdict = ['goed', 'half', 'fout'][(a.length + n++) % 3];
      return { id, juiste_onderdelen: String(a).split(/[ ,]+/).slice(0, 7), verdict, tip: tips[(a.length + n) % tips.length] };
    };
    const o = p.items ? { results: p.items.map(i => mk(i.id, i.antwoord_leerling, i.modelantwoord)) } : mk(0, p.antwoord_leerling, p.modelantwoord);
    return { choices: [{ message: { content: JSON.stringify(o) } }] };
  } } };
}
async function call(w, body, extra) {
  const log = []; n = 0;
  const r = await w.fetch(new Request('https://x/', { method: 'POST', headers: { Origin: 'https://p12357911-sudo.github.io', 'CF-Connecting-IP': '1.1.1.' + Math.floor(Math.random() * 250), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), mkEnv(log));
  return { status: r.status, body: await r.text(), log };
}
const cases = [];
S.forEach(([e, q, m, a], i) => {
  cases.push({ question: q, modelAnswer: m, studentAnswer: a, attempt: 1 + (i % 2) });
  cases.push({ question: q, modelAnswer: m, studentAnswer: '', attempt: 1 });
});
cases.push({ question: 'Noem minstens 6 scheidingsmethoden', modelAnswer: 'filtreren, indampen, destilleren, bezinken, magneet, extraheren', studentAnswer: 'filtreren, verdampen, destileren, bezinken', attempt: 1 });
cases.push({ question: 'Noem minstens zes scheidingsmethoden', modelAnswer: 'filtreren, indampen, destilleren', studentAnswer: 'filtreren', attempt: 2 });
cases.push({ question: 'x'.repeat(500), modelAnswer: 'a', studentAnswer: 'b' });
cases.push({ question: 'q' });
const batch = [];
for (const [e, q, m, a] of S.slice(0, 9)) batch.push({ id: 'k' + batch.length, question: q, modelAnswer: m, studentAnswer: a, attempt: 1 });
batch.push({ id: 'leeg', question: 'Wat is dichtheid?', modelAnswer: 'massa per volume', studentAnswer: '' });
let fouten = 0, totaal = 0;
async function vergelijk(naam, body) {
  const a = await call(oud, body), b = await call(nieuw, body);
  totaal++;
  if (a.status !== b.status || a.body !== b.body || JSON.stringify(a.log) !== JSON.stringify(b.log)) { fouten++; console.log('VERSCHIL', naam, '\n oud:', a.status, a.body.slice(0, 200), '\n nieuw:', b.status, b.body.slice(0, 200)); }
}
for (const [i, c] of cases.entries()) {
  await vergelijk('enkel#' + i, c);
  await vergelijk('enkel-lang-nl#' + i, Object.assign({}, c, { lang: 'nl' }));
  await vergelijk('enkel-lang-onzin#' + i, Object.assign({}, c, { lang: 'fr' }));
}
await vergelijk('batch', { items: batch });
await vergelijk('batch-nl', { items: batch, lang: 'nl' });
await vergelijk('batch-ongeldig', { items: [] });
console.log(`${totaal} vergelijkingen, ${fouten} verschillen`);

// Engels: moet iets anders doen (Engelse systeemprompt, Engelse standaardtips) en mag het Nederlands niet raken
const en = await call(nieuw, { items: batch, lang: 'en' });
const nl = await call(nieuw, { items: batch });
console.log('EN gebruikt Engelse systeemprompt:', /international English-language/.test(en.log[0]), '| NL niet:', !/international English-language/.test(nl.log[0]));
const leeg = await call(nieuw, { question: 'What is density?', modelAnswer: 'mass per volume', studentAnswer: '', lang: 'en' });
console.log('EN leeg:', leeg.body);
const minst = await call(nieuw, { question: 'Name at least 6 separation methods', modelAnswer: 'filtration, evaporation, distillation, settling, magnet, extraction', studentAnswer: 'filtration', lang: 'en' });
console.log('EN at least:', minst.body);
if (fouten) process.exit(1);
