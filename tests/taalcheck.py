"""Lint op de tekstbestanden: getalnotatie per taal, geen niveau-/methodenamen in EN, geen Nederlands in EN."""
import json, re, glob, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def teksten(obj):
    if isinstance(obj, str): yield obj
    elif isinstance(obj, dict):
        for v in obj.values(): yield from teksten(v)
    elif isinstance(obj, list):
        for v in obj: yield from teksten(v)

def kaal(t): return re.sub(r'<[^>]+>', '', t)
fouten = []
for taal in ('nl', 'en'):
    for f in sorted(glob.glob(f'{ROOT}/lang/{taal}/*.json')):
        for t in teksten(json.load(open(f))):
            t = kaal(t)
            if taal == 'en':
                if re.search(r'\d,\d{1,2}(?!\d)', t) or re.search(r'\d,\d{4,}', t): fouten.append((f, 'decimale komma in EN', t))
                if re.search(r'\b(vmbo|havo|vwo|mavo|nova|polaris|binas|kader|tl)\b', t, re.I): fouten.append((f, 'niveau- of methodenaam', t))
                if re.search(r'\b(het|een|van de|niet|stof|mengsel|antwoord)\b', t): fouten.append((f, 'Nederlands woord in EN', t))
            else:
                # NL: decimaalpunt tussen cijfers is fout, behalve duizendtalpunt (1.000) en versie-achtige reeksen
                for m in re.finditer(r'(?<![\d.])\d+\.\d+(?![\d.])', t):
                    if not re.fullmatch(r'\d{1,3}\.\d{3}', m.group()): fouten.append((f, 'decimaalpunt in NL', t))
print('taalcheck:', 'OK' if not fouten else f'{len(fouten)} problemen')
for x in fouten[:30]: print(' ', x)
sys.exit(1 if fouten else 0)
