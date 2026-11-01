/* ==========================================================================
   i18n.js - taalkeuze (NL/EN) en tekst uit JSON-bestanden
   --------------------------------------------------------------------------
   Waarom: de tekst staat NIET meer in de HTML, maar in lang/<taal>/*.json. Een vertaling is dus vooral
   JSON vertalen; de code (school.js, ai-nakijken.js) blijft voor alle talen gelijk.

   Bestanden:
     lang/<taal>/ui.json      knoppen, menu, meldingen, beginpagina (platte sleutel -> tekst, {n} = invulplek)
     lang/<taal>/<pagina>.json  de vragen van een pagina (KB: title, heading, intro, questions[{q,a,e?,goed?}];
                              MP: title, heading, questions[{question,answers,correctAnswer,fixed?}])

   Pagina (HTML) heeft alleen een skelet:
     <body data-pagina="kb|mp|index" data-inhoud="sk3t-stoffen-KB">
     <div id="navbar"></div> <nav class="oefen-wissel" data-wissel="sk3t-stoffen"></nav> ... <div id="inhoud"></div>
     Losse teksten in de HTML: data-i18n="sleutel" (tekst), data-i18n-html="sleutel" (met opmaak),
     data-i18n-attr="aria-label:sleutel;title:sleutel2" (attributen).

   Taalkeuze: ?lang=en|nl in het adres, anders de keuze in localStorage ('taal'), anders de taal van de browser
   (nl -> nl, de rest -> en). De NL/EN-knop bewaart de keuze en laadt de pagina opnieuw.

   Volgorde: i18n.js laadt de JSON en bouwt de pagina op bij DOMContentLoaded. school.js en ai-nakijken.js
   starten daarna (window.i18nKlaar), zodat hun bestaande code gewoon dezelfde HTML aantreft als voorheen.
   Getalnotatie: i18n.t() en i18n.num() gebruiken komma (nl) of punt (en); de getallen in de JSON staan al in de
   juiste notatie (tests/taalcheck.py bewaakt dat).
   ========================================================================== */
(function () {
  'use strict';
  var TALEN = ['nl', 'en'];
  var script = document.currentScript;
  var BASIS = (script && script.getAttribute('data-basis')) || 'lang/';

  function opslaan(t) { try { localStorage.setItem('taal', t); } catch (e) { /* privemodus: keuze niet bewaard */ } }
  function kies() {
    var m = /[?&]lang=(nl|en)\b/.exec(location.search);
    if (m) { opslaan(m[1]); return m[1]; }
    try { var o = localStorage.getItem('taal'); if (TALEN.indexOf(o) !== -1) { return o; } } catch (e) { /* geen opslag */ }
    return ((navigator.language || '') + '').toLowerCase().indexOf('nl') === 0 ? 'nl' : 'en';
  }
  var taal = kies();

  var woorden = {};      /* ui.json van de gekozen taal */
  var terugval = {};     /* ui.json van het Nederlands, voor sleutels die nog niet vertaald zijn */
  var inhoud = null;     /* de JSON van deze pagina */

  function t(sleutel, vars) {
    var s = woorden[sleutel];
    if (s === undefined) { s = terugval[sleutel]; }
    if (s === undefined) { return sleutel; }
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  }
  function num(x, decimalen) {
    var s = decimalen === undefined ? String(x) : Number(x).toFixed(decimalen);
    return taal === 'nl' ? s.replace('.', ',') : s;
  }
  function alsTekst(html) { var d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').replace(/\s+/g, ' ').trim(); }

  function haal(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) { throw new Error(url + ' ' + r.status); }
      return r.json();
    });
  }

  /* ---------- losse teksten in de HTML ---------- */
  function vulLosseTeksten() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-html]'), function (e) { e.innerHTML = t(e.getAttribute('data-i18n-html')); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-attr]'), function (e) {
      e.getAttribute('data-i18n-attr').split(';').forEach(function (p) {
        var i = p.indexOf(':');
        if (i > 0) { e.setAttribute(p.slice(0, i).trim(), t(p.slice(i + 1).trim())); }
      });
    });
  }

  /* ---------- menu met taalknop ---------- */
  function bouwMenu() {
    var plek = document.getElementById('navbar');
    if (!plek) { return; }
    var items = [['index.html#chemie', 'nav.chemie'], ['index.html#rekenen', 'nav.rekenen'], ['index.html#contact', 'nav.contact']];
    var breed = items.map(function (i) { return '<a href="' + i[0] + '" class="w3-bar-item w3-button nav-breed w3-hover-white">' + t(i[1]) + '</a>'; }).join('');
    var smal = items.map(function (i) { return '<a href="' + i[0] + '" class="w3-bar-item w3-button">' + t(i[1]) + '</a>'; }).join('');
    plek.className = 'w3-top';
    plek.innerHTML =
      '<div class="w3-bar w3-theme-d2 w3-left-align">' +
      '<a class="w3-bar-item w3-button nav-smal w3-right w3-hover-white w3-theme-d2" href="javascript:void(0);" onclick="openNav()" role="button" aria-label="' + t('nav.menu') + '" aria-controls="navDemo" aria-expanded="false"><i class="fa fa-bars"></i></a>' +
      '<div class="taal-wissel w3-right" role="group" aria-label="' + t('taal.kies') + '">' +
      TALEN.map(function (l) {
        return '<button type="button" class="taal-knop" lang="' + l + '" data-taal="' + l + '" aria-pressed="' + (l === taal ? 'true' : 'false') + '" title="' + (l === 'nl' ? 'Nederlands' : 'English') + '">' + l.toUpperCase() + '</button>';
      }).join('') + '</div>' +
      '<a href="index.html" class="w3-bar-item w3-button w3-theme-d1"><i class="fa fa-home w3-margin-right"></i>' + t('nav.home') + '</a>' + breed + '</div>' +
      '<div id="navDemo" class="w3-bar-block w3-theme-d2 w3-hide">' + smal + '</div>';
    Array.prototype.forEach.call(plek.querySelectorAll('.taal-knop'), function (k) {
      k.addEventListener('click', function () {
        var nieuw = k.getAttribute('data-taal');
        if (nieuw === taal) { return; }
        opslaan(nieuw);
        var u = new URL(location.href); u.searchParams.delete('lang');
        location.replace(u.toString());
      });
    });
  }

  function bouwWissel() {
    var nav = document.querySelector('nav.oefen-wissel[data-wissel]');
    if (!nav) { return; }
    var basis = nav.getAttribute('data-wissel'), nu = document.body.getAttribute('data-pagina');
    nav.setAttribute('aria-label', t('wissel.aria'));
    nav.innerHTML = '<a href="' + basis + '-KB.html"' + (nu === 'kb' ? ' aria-current="page"' : '') + '>' + t('wissel.kb') + '</a>' +
                    '<a href="' + basis + '-MP.html"' + (nu === 'mp' ? ' aria-current="page"' : '') + '>' + t('wissel.mp') + '</a>';
  }

  function bouwFooter() {
    var f = document.getElementById('voet');
    if (!f) { return; }
    f.innerHTML = '<footer class="w3-container w3-padding-32 w3-theme-d1 w3-center"><p>' + t('voet.powered') + ' <a href="https://www.peter-pan.nl" target="_blank" rel="noopener">peter-pan</a></p>' +
      '<div style="position:relative;bottom:100px;z-index:1;" class="w3-tooltip w3-right"><span class="w3-text w3-padding w3-teal w3-hide-small">' + t('voet.top') + '</span>' +
      '<a class="w3-button w3-theme" href="#myPage" aria-label="' + t('voet.top') + '"><span class="w3-xlarge"><i class="fa fa-chevron-circle-up"></i></span></a></div></footer>';
  }

  /* ---------- KB-pagina: precies dezelfde opbouw als de handgeschreven pagina's, zodat school.js ongewijzigd werkt ---------- */
  function bouwKB(d) {
    var c = document.getElementById('inhoud');
    var h = '<div class="kb-intro" id="kb-intro"><h2>' + d.heading + '</h2>' + (d.intro || []).map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>';
    d.questions.forEach(function (q, i) {
      var id = 'Demo' + (i + 1);
      var label = (t('kb.jouw_antwoord_op') + ' ' + alsTekst(q.q)).replace(/"/g, '&quot;');
      h += '<div>\n  <button onclick=\'myFunction("' + id + '", this)\' class=\'vraag-knop\'> ' + q.q + '</button>\n' +
           '  <input class=\'w3-input w3-border w3-round\' name=\'first\' type=\'text\' aria-label="' + label + '" placeholder=\'' + t('kb.placeholder').replace(/'/g, '&#39;') + '\'>\n' +
           '  <div id="' + id + '" class=\'w3-hide w3-container antwoord-box\'' + (q.goed ? ' data-goed="' + q.goed.join('|').replace(/"/g, '&quot;') + '"' : '') + '>\n' +
           '    <p> ' + q.a + '</p>\n' + (q.e ? '    <p class="uitleg">' + t('kb.uitleg') + ' ' + q.e + '</p>\n' : '') + '  </div>\n</div>\n';
    });
    c.className = 'w3-container';
    c.innerHTML = h;
    var vol = document.getElementById('opnieuw');
    if (vol) { vol.textContent = t('kb.opnieuw'); }
  }

  /* ---------- MP-pagina: school.js leest de globale lijst myQuestions ---------- */
  function bouwMP(d) {
    window.myQuestions = d.questions;
    var e = document.getElementById('mp-kop');
    if (e) { e.innerHTML = d.heading; }
    var b = document.getElementById('submit');
    if (b) { b.textContent = t('mp.controleer'); }
  }

  function bouwPagina() {
    document.documentElement.setAttribute('lang', taal);
    /* CSS-teksten (Antwoord:) staan in een eigen eigenschap, zodat 123school.css geen tekst bevat */
    document.documentElement.style.setProperty('--tekst-antwoord', '"' + t('kb.antwoord') + '\\00a0"');
    bouwMenu();
    bouwWissel();
    bouwFooter();
    var soort = document.body.getAttribute('data-pagina');
    if (inhoud && soort === 'kb') { bouwKB(inhoud); }
    if (inhoud && soort === 'mp') { bouwMP(inhoud); }
    vulLosseTeksten();
    if (inhoud && inhoud.title) { document.title = inhoud.title; } else if (t('titel.' + (soort || 'index')) !== 'titel.' + (soort || 'index')) { document.title = t('titel.' + (soort || 'index')); }
  }

  /* Starten: JSON ophalen (parallel), bij DOMContentLoaded de pagina bouwen. */

  var laden = [haal(BASIS + taal + '/ui.json'), taal === 'nl' ? Promise.resolve(null) : haal(BASIS + 'nl/ui.json')];
  var bodyInhoud = null; /* data-inhoud staat op <body>; die bestaat nog niet bij het laden van dit script in <head> */
  window.i18nKlaar = new Promise(function (ok) {
    var dom = new Promise(function (r) {
      if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', r); } else { r(); }
    });
    dom.then(function () {
      bodyInhoud = document.body.getAttribute('data-inhoud');
      var extra = bodyInhoud ? haal(BASIS + taal + '/' + bodyInhoud + '.json') : Promise.resolve(null);
      return Promise.all([Promise.all(laden), extra]);
    }).then(function (r) {
      woorden = r[0][0]; terugval = r[0][1] || woorden; inhoud = r[1];
      bouwPagina();
      ok();
    }, function (e) {
      var m = document.createElement('p');
      m.setAttribute('role', 'alert');
      m.textContent = 'Could not load the page text / De paginatekst kon niet worden geladen. (' + (e && e.message) + ')';
      document.body.insertBefore(m, document.body.firstChild);
      ok();
    });
  });

  window.i18n = { get lang() { return taal; }, t: t, num: num, get decimal() { return taal === 'nl' ? ',' : '.'; }, talen: TALEN };
})();
