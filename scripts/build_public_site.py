"""Verify the Jekyll publication boundary and create a local static preview.

_config.yml intentionally uses JSON, which is valid YAML, to keep this check
dependency-free. GitHub Pages consumes the same exclusion configuration.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import argparse
import json
import re
import shutil
import xml.etree.ElementTree as ET
from build_public_content import catalog, outputs

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.spinnerrealyt.pl/'
PAGES = {'index.html', 'gra.html', 'gry.html', 'kontakt.html', 'zasady-serwisu.html',
         'o-serwisie.html', 'prywatnosc.html', 'aplikacja.html', 'offline.html', '404.html',
         'tictactoe.html', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest', 'CNAME',
         'service-worker.js'}
SENSITIVE = {'others', 'docs', 'scripts', 'tests', 'templates', '.github'}


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()
        self.base = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        if tag == 'base':
            self.base = a.get('href')
        for key in ['src', 'href']:
            if a.get(key) and tag != 'base':
                self.links.append(a[key])


def public_files():
    config = json.loads((ROOT / '_config.yml').read_text())
    if config.get('url', '').rstrip('/') + '/' != ORIGIN or (ROOT / 'CNAME').read_text().strip().lower() != urlsplit(ORIGIN).hostname:
        raise ValueError('CNAME, canonical origin and Jekyll URL must agree')
    excluded = set(config['exclude'])
    if not SENSITIVE <= excluded or (ROOT / '.nojekyll').exists():
        raise ValueError('Private publication exclusions must be enabled by Jekyll')
    expected = PAGES | {g['file'] for g in catalog()}
    expected |= {p.relative_to(ROOT).as_posix() for p in (ROOT / 'assets').rglob('*') if p.is_file()}
    visible = set()
    for p in ROOT.rglob('*'):
        if not p.is_file():
            continue
        path = p.relative_to(ROOT).as_posix()
        parts = Path(path).parts
        # Jekyll's ordinary static publication rules, plus the configured boundary.
        if any(part.startswith(('.', '_')) for part in parts):
            continue
        if any(path == x or path.startswith(x + '/') for x in excluded):
            continue
        visible.add(path)
    unexpected = visible - expected
    missing = expected - visible
    if unexpected or missing:
        raise ValueError(f'Publication mismatch. Unreviewed: {sorted(unexpected)}; missing: {sorted(missing)}')
    return visible


def validate(files):
    for name, content in outputs().items():
        if (ROOT / name).read_text() != content:
            raise ValueError('Stale generated content: ' + name)
    parsed = {}
    for name in files:
        if name.endswith('.html'):
            doc = Document()
            doc.feed((ROOT / name).read_text())
            parsed[name] = doc
    def verify(ref, current):
        if ref.startswith(('data:', 'blob:', 'mailto:', 'tel:')):
            return
        page = parsed.get(current)
        base = urljoin(ORIGIN + current, page.base) if page and page.base else ORIGIN + current
        link = urlsplit(urljoin(base, ref))
        if link.netloc != urlsplit(ORIGIN).netloc or link.scheme not in ['http', 'https']:
            return
        target = unquote(link.path).lstrip('/')
        if not target or target.endswith('/'):
            target += 'index.html'
        if target not in files:
            raise ValueError(f'Unpublished local target: {current} -> {ref}')
        if link.fragment and target in parsed and unquote(link.fragment) not in parsed[target].ids:
            raise ValueError(f'Missing anchor: {current} -> {ref}')
    for name, doc in parsed.items():
        for ref in doc.links:
            verify(ref, name)
    for name in files:
        if name.endswith('.css'):
            for ref in re.findall(r'url\([\s\"\']*([^\)\s\"\']+)', (ROOT / name).read_text()):
                verify(ref, name)
        if name.endswith(('.html', '.js')):
            code = (ROOT / name).read_text()
            if re.search(r'adsbygoogle|pagead2\.googlesyndication\.com|googletagmanager\.com|google-analytics\.com', code, re.I):
                raise ValueError('Advertising/tracking requires a separate reviewed configuration: ' + name)
    for entry in ET.parse(ROOT / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
        verify(entry.text, 'sitemap.xml')
    pack = json.loads((ROOT / 'assets/offline-pack.js').read_text().split(' = ', 1)[1].rstrip(';\n'))
    if not set(pack['files']) <= files:
        raise ValueError('Offline pack contains files outside the public site')
    return {'public_files': len(files), 'games': len(catalog()), 'advertising': 'disabled', 'archive': 'excluded'}


def build(destination):
    files = public_files()
    result = validate(files)
    if destination:
        target = Path(destination).resolve()
        if target == ROOT or ROOT in target.parents or target in ROOT.parents:
            raise ValueError('Preview must be outside the source checkout')
        if target.exists() and any(target.iterdir()):
            raise ValueError('Preview directory must be empty; existing files are never deleted')
        target.mkdir(parents=True, exist_ok=True)
        for name in files:
            out = target / name
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, out)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', help='Empty directory outside the checkout for a local preview')
    args = parser.parse_args()
    print(json.dumps(build(args.output), ensure_ascii=False))
