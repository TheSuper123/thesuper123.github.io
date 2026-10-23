"""Rasterize our SVG brand mark into the sizes used by iOS and the manifest.

Requires Python Playwright and Chromium, the same tools as browser tests.
"""
from pathlib import Path
import base64
import os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
svg = (ROOT / 'assets/mark.svg').read_text()
target = ROOT / 'assets/icons'
target.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    page = browser.new_page()
    for name, size, scale in [('apple-touch-icon', 180, 1), ('app-192', 192, 1),
                               ('app-512', 512, 1), ('app-maskable-512', 512, .72)]:
        encoded = page.evaluate('''async ({svg,size,scale}) => {
          const img=new Image(); img.src='data:image/svg+xml;base64,'+btoa(svg);
          await img.decode();
          const canvas=document.createElement('canvas'); canvas.width=canvas.height=size;
          const c=canvas.getContext('2d'); c.fillStyle='#db4723'; c.fillRect(0,0,size,size);
          const edge=size*scale, inset=(size-edge)/2;
          c.drawImage(img,inset,inset,edge,edge);
          return canvas.toDataURL('image/png').split(',')[1];
        }''', dict(svg=svg, size=size, scale=scale))
        (target / (name + '.png')).write_bytes(base64.b64decode(encoded))
    browser.close()
print('Generated app icons from assets/mark.svg.')
