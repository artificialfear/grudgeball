# Buttons stay dark with light text even when the browser's default button style would show through
from playwright.sync_api import sync_playwright
install=lambda p:None
import os; F='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))
bad=[]
def check(n,c,i=''): print(('PASS ' if c else 'FAIL ')+n, '' if c else i); c or bad.append(n)
# Old-browser sim: a UA-ish pale-blue default button style, injected BEFORE the page CSS, which our CSS must override
UA="button{-webkit-appearance:button;appearance:button;background-color:#cfe3ff;color:#3a5a80;opacity:.85}"
with sync_playwright() as pw:
    b=pw.chromium.launch()
    for scheme in ['light','dark']:
        p=b.new_page(viewport={'width':1870,'height':841}, color_scheme=scheme); install(p)
        p.add_init_script(f"document.addEventListener('DOMContentLoaded',()=>{{const s=document.createElement('style');s.textContent={UA!r};document.head.prepend(s)}})")
        p.goto(F); p.evaluate("localStorage.clear()"); p.reload(); p.wait_for_timeout(300)
        p.evaluate("document.querySelector('#splash')&&document.querySelector('#splash').dispatchEvent(new Event('click'))"); p.wait_for_timeout(500)
        p.click('#startBtn',force=True); p.wait_for_timeout(400)
        info=p.evaluate("""[...document.querySelectorAll('.topbtn,.btn')].filter(e=>e.offsetParent).map(e=>{const c=getComputedStyle(e);return {id:e.id||e.className,bg:c.backgroundColor,fg:c.color,ap:c.webkitAppearance||c.appearance,op:c.opacity}})""")
        for i in info: print(scheme, i)
        def lum(s):
            import re; v=[float(x) for x in re.findall(r'[\d.]+',s)][:3]; return sum(v)/3
        check(f'{scheme}: no pale button backgrounds', all(lum(i['bg'])<120 or 'rgba(0, 0, 0, 0)' in i['bg'] or i['bg'].startswith('rgba') and float(i['bg'].split(',')[3][:-1])<0.6 and lum(i['bg'])<120 for i in info), info)
        check(f'{scheme}: light text', all(lum(i['fg'])>200 for i in info), [i['fg'] for i in info])
        check(f'{scheme}: appearance reset', all(i['ap']=='none' for i in info))
        check(f'{scheme}: full opacity', all(i['op']=='1' for i in info))
        p.screenshot(path=f'btn_{scheme}.png', clip={'x':0,'y':0,'width':1870,'height':120})
        p.close()
    b.close()
print('ALL PASS' if not bad else f'FAILED: {bad}')
