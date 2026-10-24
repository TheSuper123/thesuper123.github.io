"""Generate the same real catalog for HTML readers and the JavaScript interface."""
from pathlib import Path
from html import escape
from urllib.parse import quote
import argparse
import json
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.spinnerrealyt.pl/'


def catalog():
    # Only the static metadata runs. The catalog renderer returns before touching
    # storage, the network, or a real document. No Node capabilities enter the VM.
    code = '''const vm=require('node:vm'),fs=require('node:fs');
const env={window:{},document:{querySelector:()=>null}};
vm.runInNewContext(fs.readFileSync(0,'utf8'),env,{timeout:1000});
process.stdout.write(JSON.stringify(env.window.SpinnerGames));'''
    result = subprocess.run(['node', '-e', code], input=(ROOT / 'assets/catalog.js').read_text(),
                            capture_output=True, text=True, check=True)
    games = json.loads(result.stdout)
    if not games or len({g['id'] for g in games}) != len(games):
        raise ValueError('Catalog must have distinct game identifiers')
    for game in games:
        for key in ['name', 'file', 'art', 'desc', 'about', 'controls', 'tag']:
            if not isinstance(game.get(key), str) or not game[key].strip():
                raise ValueError(f'Missing {key}: {game.get("id")}')
        if not re.fullmatch(r'[a-z0-9-]+', game['id']):
            raise ValueError('Unsafe identifier')
    return games


def card(game, number):
    e = lambda name: escape(game[name], quote=True)
    play = 'gra.html?gra=' + quote(game['id'])
    return f'''<article class="game-card" data-game="{e('id')}">
<a class="card-image" href="{play}" tabindex="-1" aria-hidden="true"><img src="assets/art/{e('art')}.svg" alt="" width="600" height="430" loading="lazy"><span class="card-number">SG / {number:02}</span><span class="card-open">↗</span></a>
<div class="card-info"><h3><a href="{play}">{e('name')}</a></h3></div>
<p class="card-desc">{e('desc')}</p>
<div class="card-meta"><span class="card-meta-label"><a href="gry.html#{e('id')}" aria-label="Zasady gry: {e('name')}">{e('tag')} · Zasady</a></span><a class="card-quick" href="{play}" data-salon-play="{e('id')}" aria-label="Zagraj tutaj: {e('name')}">Zagraj tutaj <span aria-hidden="true">↗</span></a></div>
</article>'''


def outputs():
    games = catalog()
    index = (ROOT / 'index.html').read_text()
    cards = '\n'.join(card(g, i + 1) for i, g in enumerate(games))
    block = '<!-- public-catalog:start -->\n<div id="game-grid" class="game-grid">\n' + cards + '\n</div>\n<!-- public-catalog:end -->'
    index, count = re.subn(r'<!-- public-catalog:start -->[\s\S]*?<!-- public-catalog:end -->', lambda _: block, index)
    if count != 1:
        raise ValueError('Expected one managed catalog region')
    articles = []
    for i, game in enumerate(games):
        e = lambda name: escape(game[name], quote=True)
        articles.append(f'''<details class="rules-game" id="{e('id')}"><summary><span class="rules-number">{i+1:03}</span><span>{e('name')}</span><span aria-hidden="true">+</span></summary><div class="rules-content"><p>{e('about')}</p><h3>Sterowanie</h3><p>{e('controls')}</p><a class="button" href="gra.html?gra={quote(game['id'])}">Zagraj: {e('name')} ↗</a></div></details>''')
    rules = (ROOT / 'templates/gry.html').read_text().replace('{{GAME_COUNT}}', str(len(games))).replace('{{GAME_RULES}}', '\n'.join(articles))
    paths = ['', 'gry.html', 'kontakt.html', 'zasady-serwisu.html', 'o-serwisie.html', 'prywatnosc.html', 'aplikacja.html'] + [g['file'] for g in games]
    namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', namespace)
    sitemap = ET.Element('{' + namespace + '}urlset')
    for path in paths:
        entry = ET.SubElement(sitemap, '{' + namespace + '}url')
        ET.SubElement(entry, '{' + namespace + '}loc').text = ORIGIN + path
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(sitemap, encoding='unicode') + '\n'
    return {'index.html': index, 'gry.html': rules, 'sitemap.xml': xml}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    stale = []
    for name, text in outputs().items():
        path = ROOT / name
        if args.check:
            if not path.exists() or path.read_text() != text:
                stale.append(name)
        else:
            path.write_text(text)
    if stale:
        raise SystemExit('Regenerate public content: ' + ', '.join(stale))
    print('Public catalog, game rules and sitemap are current.' if args.check else 'Generated public catalog, game rules and sitemap.')
