"""Live-controle (GitHub Pages): intro-kader + '=' tweak, met schermafbeeldingen in ../screens/ (live_intro_*)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import browser, sync_playwright, ROOT
BASE = 'https://p12357911-sudo.github.io/training-en-preview'; S = os.path.join(ROOT, 'screens')
ok = True
with sync_playwright() as p:
    b = browser(p)
    for taal in ('en', 'nl'):
        for naam, size in (('1280', {'width': 1280, 'height': 900}), ('390', {'width': 390, 'height': 800})):
            ctx = b.new_context(viewport=size, locale='en-GB' if taal == 'en' else 'nl-NL'); page = ctx.new_page(); errs = []
            page.on('pageerror', lambda e: errs.append(str(e)))
            page.goto(f'{BASE}/rv3h-significante-cijfers-stappen-KB.html?lang={taal}'); page.wait_for_timeout(3000)
            k = page.query_selector('#kb-intro')
            print(taal, naam, 'kader:', bool(k), 'privacy in kader:', bool(page.query_selector('#kb-intro #ai-privacy')), 'scrollbreedte:', page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth'), 'fouten:', errs)
            ok &= bool(k) and not errs
            if taal == 'en':
                page.screenshot(path=f'{S}/live_intro_{naam}.png')
                # tweak live: 8x2.5=20
                for txt in ('20', '8x2.5=20', '8x2.5=21'):
                    for _ in range(10):
                        m = page.query_selector('button:has-text("More questions")')
                        if not m or not m.is_visible(): break
                        m.click(); page.wait_for_timeout(100)
                    for it in page.query_selector_all('.kb-item'):
                        if 'x / 8 = 2.5' in it.query_selector('.vraag-knop').inner_text():
                            page.evaluate("document.querySelectorAll('.kb-item input[type=text]').forEach(i=>{i.value=''})")
                            it.query_selector('input[type=text]').fill(txt); page.click('#kb-controleer'); page.wait_for_timeout(700)
                            o = it.query_selector('.kb-oordeel'); print('  ', repr(txt), '->', o.inner_text().split('\n')[0] if o else '-')
                            if txt == '8x2.5=20':
                                it.scroll_into_view_if_needed(); page.wait_for_timeout(200); page.screenshot(path=f'{S}/live_tweak_{naam}.png')
            ctx.close()
    b.close()
sys.exit(0 if ok else 1)
