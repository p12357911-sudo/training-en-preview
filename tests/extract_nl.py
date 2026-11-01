#!/usr/bin/env python3
"""Haalt de tekst uit de bestaande NL-pagina's en schrijft die als JSON (lang/nl/<pagina>.json).
Gebruik: extract_nl.py <bronmap> <uitmap>"""
import sys, json, re
from bs4 import BeautifulSoup

src, out = sys.argv[1], sys.argv[2]

def inner(el):
    return ''.join(str(c) for c in el.contents).strip()

def kb(naam):
    s = BeautifulSoup(open(f'{src}/{naam}-KB.html', encoding='utf-8').read(), 'html.parser')
    cont = s.select_one('div.w3-container')
    d = {'title': s.title.text.strip(), 'heading': inner(cont.h2)}
    d['intro'] = [inner(p) for p in cont.find_all('p', recursive=False)]
    qs = []
    for knop in s.select('button.vraag-knop'):
        blok = knop.parent
        box = blok.select_one('.antwoord-box')
        ps = box.find_all('p', recursive=False)
        q = {'q': inner(knop)}
        main = [p for p in ps if 'uitleg' not in (p.get('class') or [])]
        uit = [p for p in ps if 'uitleg' in (p.get('class') or [])]
        q['a'] = inner(main[0])
        if len(main) > 1: raise SystemExit('meer dan één antwoordalinea in ' + naam)
        if uit:
            t = inner(uit[0])
            t = re.sub(r'^Uitleg:\s*', '', t)
            q['e'] = t
        if box.get('data-goed'): q['goed'] = box['data-goed'].split('|')
        qs.append(q)
    d['questions'] = qs
    return d

def mp(naam):
    t = open(f'{src}/{naam}-MP.html', encoding='utf-8').read()
    s = BeautifulSoup(t, 'html.parser')
    m = re.search(r'var myQuestions = (\[.*?\]);\s*</script>', t, re.S)
    js = m.group(1)
    # JS-object -> JSON: sleutels citeren, enkele naar dubbele aanhalingstekens
    from subprocess import run, PIPE
    r = run(['node', '-e', 'var q=' + js + ';console.log(JSON.stringify(q))'], stdout=PIPE, text=True, check=True)
    qs = json.loads(r.stdout)
    return {'title': s.title.text.strip(), 'heading': inner(s.select_one('#scheikunde em')), 'questions': qs}

for naam in sys.argv[3:]:
    for soort, f in (('KB', kb), ('MP', mp)):
        try:
            d = f(naam)
        except FileNotFoundError:
            continue
        json.dump(d, open(f'{out}/{naam}-{soort}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(naam, soort, len(d['questions']))
