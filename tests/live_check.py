"""Snelle controle op de echte GitHub Pages-adressen, inclusief een echte AI-aanroep (EN)."""
import sys
sys.path.insert(0, __import__('os').path.dirname(__file__))
from common import browser, sync_playwright
BASE = 'https://p12357911-sudo.github.io/training-en-preview'
with sync_playwright() as p:
    b = browser(p)
    for pg in ['index', 'sk3t-stoffen-KB', 'sk3t-stoffen-MP', 'rv3h-significante-cijfers-stappen-KB']:
        ctx = b.new_context(locale='en-GB'); page = ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(f'{BASE}/{pg}.html?lang=en'); page.wait_for_timeout(2500)
        txt = page.inner_text('body')
        print(pg, 'EN ok' if ('Check' in txt or 'chemistry' in txt.lower() or 'Basics' in txt) else 'EN ??', 'fouten:', errs)
        ctx.close()
    # echte AI-aanroep
    ctx = b.new_context(locale='en-GB'); page = ctx.new_page()
    page.goto(f'{BASE}/sk3t-stoffen-KB.html?lang=en'); page.wait_for_timeout(2000)
    item = page.query_selector('.kb-item, .vraag-item') or None
    inv = page.query_selector_all('input[type=text], textarea')
    inv[0].fill('yes, copper floats because metal is light'); 
    page.click('#kb-controleer'); page.wait_for_timeout(15000)
    print('AI-uitslag:', page.inner_text('.kb-oordeel')[:300] if page.query_selector('.kb-oordeel') else 'geen oordeel')
    print(page.inner_text('#kb-uitslag')[:200] if page.query_selector('#kb-uitslag') else '')
    page.evaluate("(document.querySelector('.kb-oordeel')||document.body).scrollIntoView({block:'center'})"); page.wait_for_timeout(300); page.screenshot(path='screens/live_sk3t_en_ai.png')
    b.close()
