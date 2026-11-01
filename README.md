# Training-site: Engelstalige pilot (alleen dummy-accounts, niet voor leerlingen)

Proefversie van de Nederlandse oefensite, met een NL/EN-knop. Live repo (NL) is niet aangeraakt.
Niveau-vergelijking en aanbeveling: zie [LEVELS.md](LEVELS.md).

## Hoe de JSON-opzet werkt

De tekst staat niet in de HTML maar in JSON per taal. De HTML-pagina is een skelet; de code (school.js, ai-nakijken.js) is voor alle talen gelijk.

```
lang/<taal>/ui.json            knoppen, melding, beginpagina: platte sleutel -> tekst, {n} = invulplek
lang/<taal>/<pagina>.json      de vragen van één pagina
```

- **KB-pagina** (open vragen): `title, heading, intro[], questions[{q, a, e?, goed?}]`
- **MP-pagina** (meerkeuze): `title, heading, questions[{question, answers[], correctAnswer, fixed?}]`
- Pagina-skelet: `<body data-pagina="kb|mp|index" data-inhoud="sk3t-stoffen-KB">` + `<div id="inhoud"></div>`.
- Losse tekst in de HTML: `data-i18n="sleutel"`, `data-i18n-html="sleutel"` (met opmaak), `data-i18n-attr="aria-label:sleutel"`.
- In JS: `i18n.t('sleutel', {n: 3})`, `i18n.num(2.5, 1)`.
- Ontbreekt een sleutel in een taal, dan valt de site terug op het Nederlands.
- **Taalkeuze**: `?lang=en|nl` in het adres, anders `localStorage 'taal'`, anders de browsertaal (nl -> nl, de rest -> en). De NL/EN-knop bewaart de keuze en laadt de pagina opnieuw (getypte antwoorden gaan dan verloren).
- **Getalnotatie**: komma in NL, punt in EN. De getallen in de JSON staan al in de juiste notatie. De nakijker accepteert in NL `2,7` en `2.7`, in EN `2.7` (en `1,000` als duizendtal-komma). Antwoorden worden getoond in de notatie van de gekozen taal.
- **Nakijkregels per taal** in ui.json: `kb.of_regex` ("of"/"or") en `kb.dus_regex` ("dus"/"so|thus").

### Een taal of pagina toevoegen
1. Nieuwe pagina: kopieer een skelet-HTML, zet `data-inhoud`, maak `lang/nl/<naam>.json` en `lang/en/<naam>.json`.
2. Nieuwe taal: voeg de code toe aan `TALEN` in i18n.js, maak `lang/<code>/` met dezelfde bestanden en sleutels.
3. Draai `python3 tests/taalcheck.py` (sleutels gelijk, getalnotatie, geen niveau- of methodenamen in de leerlingtekst).

## AI-nakijken
`ai-nakijken.js` stuurt `{items, lang}` naar de Worker `school-nakijken-en` (`worker/worker.js`, zonder sleutels). Zonder `lang` (of `nl`) werkt de Worker precies als de productie-Worker: zelfde prompt, zelfde cache-sleutels, zelfde tips (regressietest: 0 verschillen over 207 vergelijkingen). Met `lang: "en"` komt de feedback in het Engels. Sleutels staan als Worker-secrets, niet in de repo.

## Tests
- `tests/test_nl_parity.py`: de NL-pagina's uit de JSON zijn gelijk aan de bestaande NL-pagina's (vergelijkt met de huidige NL-site, pad in `tests/common.py`).
- `tests/test_pilot.py` (Playwright): knop en onthouden van de keuze, getalnotatie, nakijker in NL en EN, MP, AI (EN), mobiel 390 px en desktop 1280 px, schermafbeeldingen in `screens/`.
- `tests/taalcheck.py`: taal-lint op de JSON.

## Opmaak
Arial, tekst #111111, koppen #003A5C, geen grijze tekst, minimaal 10 pt, kaders 1,3 pt.
