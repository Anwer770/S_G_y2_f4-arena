#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تدقيق المرحلة 0 — الجزء الثاني:
1) خريطة التخزين الحقيقية: مفتاح → دالة load/save → كل القارئين/الكاتبين
2) مصفوفة CRUD من App.tsx والخدمات
3) سجل المكونات المحمية: props + الاستيرادات + الحقول + الأزرار
4) قائمة الوحدات/التبويبات من الأنواع
"""
import json, os, re
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'docs', 'تدقيق')

def read(p):
    with open(p, encoding='utf-8', errors='ignore') as f:
        return f.read()

def rel(p):
    return os.path.relpath(p, ROOT).replace(os.sep, '/')

def files(exts=('.ts', '.tsx')):
    for dp, dn, fn in os.walk(SRC):
        for f in sorted(fn):
            if f.endswith(exts):
                yield os.path.join(dp, f)

all_files = list(files())
blob = {rel(f): read(f) for f in all_files}

# ---------------------------------------------------------- 1) storage map
STORAGE_KEYS_BLOCK = re.search(r'const STORAGE_KEYS\s*=\s*\{(.*?)\n\};', blob['src/utils/storage.ts'], re.S)
keys = {}
if STORAGE_KEYS_BLOCK:
    for m in re.finditer(r"([A-Z_0-9]+)\s*:\s*'([^']+)'", STORAGE_KEYS_BLOCK.group(1)):
        keys[m.group(1)] = m.group(2)

storage_map = {}
for const, key in keys.items():
    storage_map[key] = {'constName': const, 'declaredIn': 'src/utils/storage.ts', 'loadFn': None, 'saveFn': None, 'readers': [], 'writers': []}

src_storage = blob['src/utils/storage.ts']
# map loadX/saveX functions to the keys they touch
for m in re.finditer(r'export function (load|save)(\w+)\s*\(', src_storage):
    kind, name = m.group(1), m.group(2)
    start = m.start()
    nxt = src_storage.find('\nexport function', start + 10)
    body = src_storage[start: nxt if nxt > 0 else len(src_storage)]
    for const, key in keys.items():
        if re.search(rf'STORAGE_KEYS\.{const}\b', body):
            fn = kind + name
            if kind == 'load' and not storage_map[key]['loadFn']:
                storage_map[key]['loadFn'] = fn
            if kind == 'save' and not storage_map[key]['saveFn']:
                storage_map[key]['saveFn'] = fn

# callers across the app
for path, s in blob.items():
    if path == 'src/utils/storage.ts':
        continue
    for key, info in storage_map.items():
        for fn in (info['loadFn'], info['saveFn']):
            if not fn:
                continue
            if re.search(rf'\b{fn}\s*\(', s):
                (info['readers'] if fn.startswith('load') else info['writers']).append(path)
for info in storage_map.values():
    info['readers'] = sorted(set(info['readers']))
    info['writers'] = sorted(set(info['writers']))

# ---------------------------------------------------------- 2) CRUD matrix
app = blob.get('src/app/App.tsx', '')
crud = {'handlers': [], 'state': [], 'importedLoaders': [], 'importedSavers': []}
for m in re.finditer(r'const\s+(handle\w+|on\w+)\s*=\s*(?:useCallback\(\s*)?\(([^)]*)\)\s*=>', app):
    crud['handlers'].append({'name': m.group(1), 'args': m.group(2).strip()[:80]})
for m in re.finditer(r'const\s+\[(\w+),\s*(set\w+)\]\s*=\s*useState', app):
    crud['state'].append({'state': m.group(1), 'setter': m.group(2)})
for m in re.finditer(r'import\s*\{([^}]+)\}\s*from\s*[\'"]\.\.[\/]+utils/storage[\'"]', app, re.S):
    names = [x.strip() for x in m.group(1).split(',') if x.strip()]
    crud['importedLoaders'] = [n for n in names if n.startswith('load')]
    crud['importedSavers'] = [n for n in names if n.startswith('save')]

# services CRUD surface
services = {}
for path, s in blob.items():
    if '/services/' in path or '/repositories/' in path:
        fns = re.findall(r'(?:export\s+)?(?:async\s+)?function\s+(\w+)', s)
        fns += [m.group(1) for m in re.finditer(r'static\s+(?:async\s+)?(\w+)\s*\(', s)]
        names = sorted(set(fns))
        services[path] = [n for n in names if not n.startswith('_')][:40]

# ---------------------------------------------------------- 3) protected registry
PROT_RE = re.compile(r'(Modal|Form|Drawer|Dialog|Wizard|Editor|Sheet)', re.I)
PROP_BLOCK = re.compile(r'(?:interface|type)\s+(\w*Props|Props)\s*(?:=|)\s*\{(.*?)\n\}', re.S)
registry = []
for path, s in blob.items():
    base = os.path.basename(path)
    if not PROT_RE.search(base) or '/components/' not in path:
        continue
    props = []
    m = PROP_BLOCK.search(s)
    if m:
        for pm in re.finditer(r'^\s*(\w+)(\?)?\s*:\s*([^;\n]+)', m.group(2), re.M):
            props.append({'name': pm.group(1), 'optional': bool(pm.group(2)), 'type': pm.group(3).strip()[:60]})
    labels = sorted(set(x.strip() for x in re.findall(r'<label[^>]*>([^<]{2,50})</label>', s)))
    placeholders = sorted(set(re.findall(r'placeholder\s*=\s*["\']([^"\']{2,60})["\']', s)))
    buttons = sorted(set(x.strip() for x in re.findall(r'<button[^>]*>\s*([^<>{}]{2,40})\s*</button>', s)))
    services_used = sorted({p for p in blob if p in s or os.path.basename(p).split('.')[0] in s})
    registry.append({
        'component': base.replace('.tsx', ''),
        'file': path,
        'loc': sum(1 for _ in open(os.path.join(ROOT, path), encoding='utf-8', errors='ignore')),
        'propsCount': len(props),
        'props': props,
        'callbacks': [p['name'] for p in props if p['name'].startswith('on')],
        'dataCallbacks': [p['name'] for p in props if not p['name'].startswith(('on', 'is', 'show', 'open', 'class', 'theme'))][:25],
        'labels': labels[:20],
        'placeholders': placeholders[:20],
        'buttons': buttons[:12],
        'validation': bool(re.search(r'errors?\b|isValid|validate|required', s)),
        'writesStorage': bool(re.search(r'\bsave\w+\s*\(|\bsetItem\s*\(|\bonSave\s*\(|\bonSubmit\s*\(', s)),
        'saveCalls': sorted(set(re.findall(r'\b(save\w+|onSave|handleSave|onSubmit|handleSubmit|onCreate|handleCreate|update\w+)\s*\(', s)))[:12],
    })
registry.sort(key=lambda r: -r['loc'])

# ---------------------------------------------------------- 4) modules/tabs
tabs = []
for path, s in blob.items():
    if 'types' in path:
        m = re.search(r'ActiveModuleTab\s*=\s*(.*?);', s, re.S)
        if m:
            tabs = re.findall(r"'([a-z0-9_-]+)'", m.group(1))
            break

out = {
    'storageMap': storage_map,
    'crud': crud,
    'services': services,
    'protectedRegistry': registry,
    'tabs': tabs,
    'counts': {
        'storageKeys': len(storage_map),
        'keysWithReader': len([v for v in storage_map.values() if v['readers']]),
        'keysWithWriter': len([v for v in storage_map.values() if v['writers']]),
        'keysNeverRead': len([v for v in storage_map.values() if not v['readers']]),
        'protectedComponents': len(registry),
        'crudHandlers': len(crud['handlers']),
        'stateHooks': len(crud['state']),
    },
}
os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, 'audit2.json'), 'w', encoding='utf-8') as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)

print(json.dumps(out['counts'], ensure_ascii=False, indent=2))
print('--- tabs ---')
print(', '.join(tabs))
print('--- CRUD handlers in App.tsx ---')
for h in crud['handlers']:
    print(f"  {h['name']}({h['args']})")
print('--- loaders/savers imported by App.tsx ---')
print('loaders:', len(crud['importedLoaders']), 'savers:', len(crud['importedSavers']))
print('--- storage keys with no readers ---')
for k, v in storage_map.items():
    if not v['readers']:
        print(f"  {k}  (load={v['loadFn']} save={v['saveFn']})")
print('--- top protected components ---')
for r in registry[:12]:
    print(f"  {r['loc']:>5} LOC {r['component']:<28} props={r['propsCount']:<3} callbacks={len(r['callbacks'])} writes={r['writesStorage']}")
