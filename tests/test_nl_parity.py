"""NL-pariteit: de NL-pagina's van de pilot (tekst uit JSON) moeten hetzelfde zijn als de huidige handgeschreven NL-pagina's."""
import sys, re, json
from common import *

def norm(s): return re.sub(r'\s+', ' ', s or '').strip()

JS_KB = """() => { const o = {title: document.title, h2: document.querySelector('h2').innerHTML.trim(), intro: [...document.querySelectorAll('.w3-container > p')].filter(p=>!p.closest('.antwoord-box') && !p.closest('footer')).map(p=>p.innerHTML.trim()),
  q: [...document.querySelectorAll('button.vraag-knop')].map(b => { const w=b.parentNode; const i=w.querySelector('input'); const box=w.querySelector('.antwoord-box');
   return {q:b.innerHTML.trim(), aria:i.getAttribute('aria-label'), ph:i.getAttribute('placeholder'), box: box.innerHTML.replace(/\\s+/g,' ').trim(), goed: box.getAttribute('data-goed'), cls: box.className, eind: !!box.querySelector('.eindantwoord')}; }),
  zweef: (document.getElementById('zweefknop')||{}).textContent, opn: ([...document.querySelectorAll('a.knop-blauw')].map(a=>a.textContent.trim())), nav:[...document.querySelectorAll('.oefen-wissel a')].filter(a=>!/rv3h/.test(a.getAttribute('href'))).map(a=>a.textContent+'|'+a.getAttribute('href')+'|'+a.getAttribute('aria-current'))};
  o.q.sort((x,y)=>x.q<y.q?-1:1); return o; }"""
JS_MP = """() => { const q=[...document.querySelectorAll('.vraag-blok')].map(b=>b.querySelector('.question').innerHTML.trim()+' || '+[...b.querySelectorAll('label')].map(l=>l.textContent.trim().replace(/^[a-d]: /,'')).sort().join(' / ')); q.sort();
  return {title: document.title, kop: (document.querySelector('#scheikunde em')||{}).innerHTML, btn: (document.getElementById('submit')||{}).textContent, zweef: (document.getElementById('zweefknop')||{}).textContent, n:q.length, q:q}; }"""

bad = 0
with sync_playwright() as p:
    b = browser(p)
    new = serve(ROOT); old = serve(ORIG)
    for pg, js in (('sk3t-stoffen-KB', JS_KB), ('rv3h-significante-cijfers-stappen-KB', JS_KB), ('sk3t-stoffen-MP', JS_MP)):
        res = []
        for base, taal in ((old, None), (new, 'nl')):
            ctx, page, errs = nieuwe_pagina(b, taal)
            page.goto(f'{base}/{pg}.html', wait_until='domcontentloaded'); page.wait_for_timeout(2500)
            res.append(page.evaluate(js)); ctx.close()
        a, c = res
        if a == c: print('GELIJK ', pg)
        else:
            bad += 1; print('VERSCHIL', pg)
            for k in a:
                if a[k] != c[k]:
                    if isinstance(a[k], list) and len(a[k]) == len(c[k]):
                        for i, (x, y) in enumerate(zip(a[k], c[k])):
                            if x != y: print('  ', k, i, '\n    orig:', x, '\n    pilot:', y); break
                    else: print('  ', k, '\n    orig:', a[k], '\n    pilot:', c[k])
    b.close()
sys.exit(1 if bad else 0)
