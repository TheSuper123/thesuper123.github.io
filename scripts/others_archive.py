#!/usr/bin/env python3
"""Encrypt the review collection. Passwords are read without echo and are never saved.

Requires Python cryptography. Runtime decryption uses built-in browser Web Crypto.
"""
import argparse
import base64
import getpass
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import shutil
import tempfile

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ITERATIONS = 600_000
AAD_PREFIX = b'spinner-others-v1\x00'
ROOT = Path(__file__).resolve().parents[1]
SOURCE_ENTRIES = [
    'games/doom.html', 'games/doomfiles', 'games/geometrydashlite986.html',
    'games/gdlitefiles', 'games/tetris.html', 'games/flappybird.html',
    'games/blockblast.html', 'skibidifish.html', 'Logo.png', 'logo.png', 'LogoBack.png',
    'assets/art/tetris.svg', 'assets/art/bird.svg', 'assets/art/blocks.svg', 'assets/art/doom.svg',
]

def derive(password, salt):
    material = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, ITERATIONS, 64)
    return material[:32], hashlib.sha256(material[32:]).digest()

def safe_relative(path):
    value=Path(path)
    if value.is_absolute() or '..' in value.parts or '\\' in path or not path:
        raise ValueError('Invalid archive path')
    return value.as_posix()

def media_type(path):
    suffix=Path(path).suffix.lower()
    return {'.js':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8',
            '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
            '.md':'text/plain; charset=utf-8','.unityweb':'application/octet-stream',
            '.wasm':'application/wasm'}.get(suffix,mimetypes.guess_type(path)[0] or 'application/octet-stream')

def encrypt_collection(contents, password, destination, originals=()):
    """Write ciphertext only; verify every GCM tag and exact bytes before publishing metadata."""
    destination=Path(destination)
    destination.mkdir(parents=True,exist_ok=True)
    if (destination/'data').exists() or (destination/'manifest.json').exists():
        raise ValueError('Archive already exists; restore/rebuild explicitly instead of overwriting it')
    salt=os.urandom(32)
    key,verifier=derive(password,salt)
    aes=AESGCM(key)
    info={'version':1,'cipher':'AES-256-GCM','kdf':{'name':'PBKDF2-SHA-256',
        'iterations':ITERATIONS,'salt':base64.b64encode(salt).decode()},
        'verifier':base64.b64encode(verifier).decode(),'files':{},'originals':list(originals)}
    ivs=set()
    with tempfile.TemporaryDirectory(prefix='others-encrypted-',dir=destination.parent) as temporary:
        staging=Path(temporary);(staging/'data').mkdir()
        for path,content in sorted(contents.items()):
            path=safe_relative(path)
            iv=os.urandom(12)
            while iv in ivs:iv=os.urandom(12)
            ivs.add(iv)
            encrypted=aes.encrypt(iv,content,AAD_PREFIX+path.encode('utf-8'))
            if aes.decrypt(iv,encrypted,AAD_PREFIX+path.encode('utf-8'))!=content:
                raise ValueError('Encryption roundtrip failed')
            filename='data/'+hashlib.sha256(path.encode('utf-8')).hexdigest()+'.enc'
            staging.joinpath(filename).write_bytes(iv+encrypted)
            info['files'][path]={'file':filename,'mime':media_type(path),'size':len(content),
                                 'sha256':hashlib.sha256(content).hexdigest()}
        # Verify the exact bytes read back from disk, not only the in-memory ciphertext.
        for path,item in info['files'].items():
            blob=staging.joinpath(item['file']).read_bytes()
            if aes.decrypt(blob[:12],blob[12:],AAD_PREFIX+path.encode('utf-8'))!=contents[path]:
                raise ValueError('Written ciphertext verification failed')
        staging.joinpath('manifest.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n')
        os.replace(staging/'data',destination/'data')
        os.replace(staging/'manifest.json',destination/'manifest.json')
    return info

def decrypt_collection(directory,password):
    directory=Path(directory)
    info=json.loads(directory.joinpath('manifest.json').read_text())
    key,verifier=derive(password,base64.b64decode(info['kdf']['salt']))
    import hmac
    if not hmac.compare_digest(verifier,base64.b64decode(info['verifier'])):
        raise ValueError('Incorrect password')
    result={};aes=AESGCM(key)
    for path,item in info['files'].items():
        safe_relative(path)
        blob=directory.joinpath(item['file']).read_bytes()
        content=aes.decrypt(blob[:12],blob[12:],AAD_PREFIX+path.encode('utf-8'))
        if hashlib.sha256(content).hexdigest()!=item['sha256']:raise ValueError('Integrity check failed')
        result[path]=content
    return info,result

def source_files(root):
    result=[]
    for name in SOURCE_ENTRIES:
        path=root/name
        if not path.exists():raise ValueError('Missing source: '+name)
        candidates=sorted(path.rglob('*')) if path.is_dir() else [path]
        for candidate in candidates:
            if candidate.is_symlink():raise ValueError('Symlink in selected source tree')
            if candidate.is_file():result.append(candidate.relative_to(root).as_posix())
    if len(result)!=len(set(result)):raise ValueError('Overlapping source entries')
    return sorted(result)

def private_pages(root):
    # Keep descriptions for the review collection out of the public catalog.
    import re,subprocess
    data=json.loads(subprocess.run(['node','-e',
        'global.window={};global.document={querySelector:()=>null};require("./assets/catalog.js");process.stdout.write(JSON.stringify(window.SpinnerGames));'],
        cwd=root,check=True,capture_output=True,text=True).stdout)
    games=[game for game in data if game['id'] in {'tetris','bird','blocks','doom'}]
    games += [
        {'id':'geometry-lite','name':'Geometry Dash Lite','file':'games/geometrydashlite986.html','tag':'ARCHIWUM UNITY','desc':'Starsza kompilacja do weryfikacji praw.','about':'Zachowana starsza kompilacja Unity. Wymaga potwierdzenia praw do kodu i zasobów.','controls':'Spacja lub dotknięcie: skok.'},
        {'id':'skibidi-fish','name':'Skibidi Fish','file':'skibidifish.html','tag':'ARCHIWUM','desc':'Starsza gra do weryfikacji pochodzenia.','about':'Zachowana wcześniejsza gra. Autorstwo i prawa do użytej oprawy wymagają potwierdzenia.','controls':'Użyj przycisków gry.'},
    ]
    if len(games)!=6:raise ValueError('Expected review games are missing from the current catalog')
    from html import escape
    links=''.join(f'<li><a href="gra.html?gra={game["id"]}"><strong>{escape(game["name"])}</strong><span>Otwórz ↗</span></a></li>' for game in games)
    index=f'''<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Others — kolekcja do przeglądu</title><link rel="stylesheet" href="assets/site.css"><style>main{{max-width:820px;padding:30px 24px;margin:auto}}h1{{font-size:45px;letter-spacing:-2px;line-height:1.1}}p{{font-size:13px;color:var(--muted)}}ol{{list-style:none;padding:0;margin:30px 0}}li a{{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--line);padding:20px 0;gap:15px}}li span{{font-size:11px}}.files{{display:flex;gap:20px;flex-wrap:wrap;font-size:12px}}.files a{{text-decoration:underline}}</style></head><body><main><div class="eyebrow orange">OTHERS / MATERIAŁY DO WERYFIKACJI</div><h1>Zachowane do przeglądu.</h1><p>Materiały o niepotwierdzonym pochodzeniu lub zakresie zezwoleń. Ograniczony dostęp nie zastępuje licencji.</p><ol>{links}</ol><h2>Poprzednie grafiki</h2><div class="files"><a href="Logo.png" download>Logo.png ↗</a><a href="logo.png" download>logo.png ↗</a><a href="LogoBack.png" download>LogoBack.png ↗</a></div><p>Blokowanie archiwum jest dostępne w panelu nad tą ramką.</p></main></body></html>'''
    main=re.search(r'<main id="main">([\s\S]*?)</main>',root.joinpath('gra.html').read_text()).group(1)
    player='''<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Others — gra</title><link rel="stylesheet" href="assets/site.css"><script src="assets/storage.js" defer></script><script src="assets/site.js" defer></script><script src="assets/catalog.js" defer></script><script src="assets/play.js" defer></script></head><body><main id="main">'''+main.replace('index.html#gry','index.html').replace('Wszystkie gry','Archiwum others')+'</main></body></html>'
    return {'index.html':index.encode(),'gra.html':player.encode(),
        'assets/catalog.js':('window.SpinnerGames = '+json.dumps(games,ensure_ascii=False)+';').encode()}

def pack(root,password,remove):
    paths=source_files(root)
    contents={path:root.joinpath(path).read_bytes() for path in paths}
    contents.update(private_pages(root))
    info=encrypt_collection(contents,password,root/'others',paths)
    if remove:
        if source_files(root)!=paths:raise ValueError('Sources changed; originals retained')
        for path in paths:
            if hashlib.sha256(root.joinpath(path).read_bytes()).hexdigest()!=info['files'][path]['sha256']:
                raise ValueError('Source changed; originals retained: '+path)
        for path in paths:root.joinpath(path).unlink()
        for name in SOURCE_ENTRIES:
            path=root/name
            if path.is_dir():
                for directory in sorted((p for p in path.rglob('*') if p.is_dir()),key=lambda p:len(p.parts),reverse=True):directory.rmdir()
                path.rmdir()
    print(f'Encrypted and verified {len(contents)} files. Original source files: {len(paths)}. Plaintext sources removed: {remove}.')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['pack','verify','restore'])
    parser.add_argument('--root',type=Path,default=ROOT)
    parser.add_argument('--remove-sources',action='store_true')
    parser.add_argument('--destination',type=Path)
    args=parser.parse_args()
    password=getpass.getpass('Archive password (not saved): ')
    if args.action=='pack':pack(args.root.resolve(),password,args.remove_sources)
    else:
        info,contents=decrypt_collection(args.root/'others',password)
        if args.action=='restore':
            if not args.destination:parser.error('--destination is required for restore')
            destination=args.destination.resolve()
            if destination.is_relative_to(args.root.resolve()):parser.error('Restore outside the published checkout')
            if destination.exists():parser.error('Destination must not exist; existing files are never overwritten')
            destination.mkdir(parents=True,mode=0o700)
            for path,content in contents.items():
                target=destination/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(content);target.chmod(0o600)
        print(f'Verified {len(contents)} encrypted files; password not retained.')

if __name__=='__main__':main()
