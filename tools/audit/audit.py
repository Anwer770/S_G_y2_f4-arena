#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
أداة تدقيق المشروع (Project Audit) — Phase 0 Discovery
تقرأ الشيفرة وتحوّل البنية إلى جرد JSON قابل لإعادة التشغيل.
لا تعدّل أي ملف من ملفات التطبيق. المخرجات في docs/تدقيق/ فقط.
"""
import json
import os
import re
import sys
from collections import defaultdict, Counter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
OUT_DIR = os.path.join(ROOT, 'docs', 'تدقيق')

# ---------------------------------------------------------------- helpers
def read(p):
    with open(p, encoding='utf-8', errors='ignore') as f:
        return f.read()

def rel(p):
    return os.path.relpath(p, ROOT).replace(os.sep, '/')

def walk_files(exts=('.ts', '.tsx')):
    for dp, dn, fn in os.walk(SRC):
        dn[:] = [d for d in dn if d not in ('node_modules',)]
        for f in sorted(fn):
            if f.endswith(exts):
                yield os.path.join(dp, f)

def resolve(f, spec):
    if not spec.startswith('.'):
        return None
    tgt = os.path.normpath(os.path.join(os.path.dirname(f), spec))
    for ext in ('', '.ts', '.tsx', '/index.ts', '/index.tsx'):
        p = tgt + ext
        if os.path.isfile(p):
            return p
    return None

IMPORT_RE = re.compile(r"""from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]""")

def imports_of(f):
    s = read(f)
    out = set()
    for m in IMPORT_RE.finditer(s):
        r = resolve(f, m.group(1) or m.group(2))
        if r:
            out.add(os.path.normpath(r))
    return out

def loc(p):
    return sum(1 for _ in open(p, encoding='utf-8', errors='ignore'))

# ---------------------------------------------------------------- classify
PROTECTED_RE = re.compile(r'(Modal|Form|Drawer|Dialog|Wizard|Editor|Sheet|Import.*Modal)', re.I)
SERVICE_HINT = re.compile(r'export\s+(const|function|async function|class)\s+(\w+)')
INPUT_RE = re.compile(r'<(input|select|textarea|button)\b([^>]*)>', re.S)
NAME_RE = re.compile(r'name\s*=\s*["\'{]')
PLACEHOLDER_RE = re.compile(r'placeholder\s*=\s*["\']([^"\']{2,60})["\']')
LABEL_RE = re.compile(r'<label[^>]*>([^<]{2,60})</label>')
REQUIRED_RE = re.compile(r'\brequired\b|validate|validation|isValid|error', re.I)
HANDLER_RE = re.compile(r'\b(onSubmit|onSave|handleSubmit|handleSave|onConfirm|handleCreate|handleUpdate|handleDelete)\b')

def classify(path):
    r = rel(path)
    low = r.lower()
    tags = []
    base = os.path.basename(path)
    if PROTECTED_RE.search(base):
        tags.append('protected-input')
    if '/components/' in r:
        tags.append('component')
        seg = r.split('/components/')[1].split('/')[0]
        tags.append('module:' + seg)
    if '/services/' in r:
        tags.append('service')
    if '/database/repositories/' in r or 'Repository' in base:
        tags.append('repository')
    if '/database/adapters/' in r or 'Adapter' in base:
        tags.append('adapter')
    if '/context/' in r:
        tags.append('state-context')
    if '/app/router/' in r or 'Router' in base:
        tags.append('routing')
    if '/types/' in r or base.startswith('types'):
        tags.append('types')
    if '/utils/' in r:
        tags.append('utility')
    if '/sync/' in r:
        tags.append('sync')
    if '/core/' in r:
        tags.append('core')
    if '/hooks/' in r or base.startswith('use'):
        tags.append('hook')
    if 'storage' in low:
        tags.append('storage')
    if 'excel' in low or 'import' in low or 'export' in low:
        tags.append('excel-io')
    return tags

# ---------------------------------------------------------------- scan
files = list(walk_files())
reachable = set()
stack = [os.path.join(SRC, 'main.tsx')]
while stack:
    f = stack.pop()
    if f in reachable or not os.path.isfile(f):
        continue
    reachable.add(f)
    stack.extend(imports_of(f))

inventory = []
for f in files:
    s = read(f)
    prot = bool(PROTECTED_RE.search(os.path.basename(f)))
    item = {
        'file': rel(f),
        'loc': loc(f),
        'bytes': os.path.getsize(f),
        'tags': classify(f),
        'reachableFromEntry': f in reachable,
        'exports': sorted(set(m.group(2) for m in SERVICE_HINT.finditer(s)))[:30],
        'inputs': len(INPUT_RE.findall(s)),
        'hasNameAttr': bool(NAME_RE.search(s)),
        'hasValidation': bool(REQUIRED_RE.search(s)),
        'handlers': sorted(set(e for e in HANDLER_RE.findall(s))),
        'storageKeys': sorted(set(re.findall(r"'(suite_[a-z0-9_]+)'", s)))[:30],
    }
    if prot:
        item['protectedFields'] = sorted(set(PLACEHOLDER_RE.findall(s)))[:25]
        item['protectedLabels'] = sorted(set(x.strip() for x in LABEL_RE.findall(s)))[:25]
    inventory.append(item)

# ---------------------------------------------------------------- storage map
STORAGE_CONST_RE = re.compile(r"([A-Z_0-9]+)\s*:\s*'(suite_[a-z0-9_]+)'")
storage_names = {}
for f in files:
    s = read(f)
    for m in STORAGE_CONST_RE.finditer(s):
        storage_names.setdefault(m.group(2), {'constName': m.group(1), 'declaredIn': rel(f), 'reads': [], 'writes': []})

for f in files:
    s = read(f)
    for key in storage_names:
        for call in ('getItem', 'load'):
            if re.search(rf"{call}\w*\([^)]*{re.escape(key)}", s):
                storage_names[key]['reads'].append(rel(f))
        for call in ('setItem', 'save'):
            if re.search(rf"{call}\w*\([^)]*{re.escape(key)}", s):
                storage_names[key]['writes'].append(rel(f))
    # loose literal usage
    for key in re.findall(r"'(suite_[a-z0-9_]+)'", s):
        storage_names.setdefault(key, {'constName': '(literal)', 'declaredIn': rel(f), 'reads': [], 'writes': []})

for k, v in storage_names.items():
    v['reads'] = sorted(set(v['reads']))
    v['writes'] = sorted(set(v['writes']))

# ---------------------------------------------------------------- types / contracts
TYPE_RE = re.compile(r'export\s+(?:interface|type)\s+(\w+)\s*=?', )
types_found = defaultdict(list)
for f in files:
    s = read(f)
    for m in TYPE_RE.finditer(s):
        types_found[m.group(1)].append(rel(f))

dup_types = {k: v for k, v in types_found.items() if len(set(v)) > 1}

# fields per interface (best-effort) for core entities
CORE_ENTITIES = ['Customer', 'DoctorRecord', 'DoctorVisitLog', 'CustomerVisitRecord', 'Task', 'Commitment',
                 'FinancialTransaction', 'DebtRecord', 'DebtCommitment', 'MovementRecord', 'Product',
                 'CustodyIssue', 'NoteRecord', 'LinkRecord']
contracts = {}
for f in files:
    s = read(f)
    for ent in CORE_ENTITIES:
        m = re.search(rf'export\s+interface\s+{ent}\b[^{{]*{{(.*?)}}', s, re.S)
        if m:
            body = m.group(1)
            fields = re.findall(r'^\s*(?:readonly\s+)?([a-zA-Z_][\w]*)\s*[?]?\s*:', body, re.M)
            if ent not in contracts or len(fields) > len(contracts[ent]['fields']):
                contracts[ent] = {'definedIn': rel(f), 'fields': fields, 'count': len(fields)}

# ---------------------------------------------------------------- id prefixes / relations
ID_PREFIX_RE = re.compile(r"'([A-Z]{2,6})-'")
relations = Counter()
for f in files:
    s = read(f)
    for m in re.finditer(r'\b(customerId|doctorId|taskId|projectId|debtId|commitmentId|visitId|productId|accountId|noteId|issueId|custodyId|relatedId|parentId)\b', s):
        relations[m.group(1)] += 1

# ---------------------------------------------------------------- duplication signals
func_defs = defaultdict(list)
for f in files:
    s = read(f)
    for m in re.finditer(r'(?:function|const)\s+(\w{4,})\s*[=(]', s):
        func_defs[m.group(1)].append(rel(f))
dup_funcs = {k: sorted(set(v)) for k, v in func_defs.items() if len(set(v)) > 2}

# ---------------------------------------------------------------- ui stats
ui_stats = Counter()
for f in files:
    s = read(f)
    ui_stats['darkClasses'] += len(re.findall(r'\bdark:', s))
    ui_stats['rows_x_overflow'] += len(re.findall(r'overflow-x-auto', s))
    ui_stats['tables'] += len(re.findall(r'<table', s))
    ui_stats['responsive_sm'] += len(re.findall(r'\bsm:', s))
    ui_stats['responsive_md'] += len(re.findall(r'\bmd:', s))
    ui_stats['localStorageDirect'] += len(re.findall(r'\blocalStorage\.', s))
    ui_stats['dbStorageCalls'] += len(re.findall(r'\bdbStorage\.', s))
    ui_stats['consoleLog'] += len(re.findall(r'console\.(log|debug)', s))
    ui_stats['anyTypes'] += len(re.findall(r':\s*any\b', s))

# ---------------------------------------------------------------- output
report = {
    'summary': {
        'sourceFiles': len(files),
        'sourceLOC': sum(loc(f) for f in files),
        'reachableFiles': len(reachable),
        'unreachableFiles': len([f for f in files if f not in reachable]),
        'unreachableLOC': sum(loc(f) for f in files if f not in reachable),
        'protectedComponents': len([i for i in inventory if 'protected-input' in i['tags']]),
        'storageKeys': len(storage_names),
        'duplicateTypeNames': len(dup_types),
        'sharedFuncNames': len(dup_funcs),
    },
    'uiStats': dict(ui_stats),
    'inventory': inventory,
    'storage': storage_names,
    'contracts': contracts,
    'duplicateTypes': {k: sorted(set(v)) for k, v in dup_types.items()},
    'duplicateFunctions': dup_funcs,
    'relationFields': dict(relations.most_common()),
}
os.makedirs(OUT_DIR, exist_ok=True)
with open(os.path.join(OUT_DIR, 'inventory.json'), 'w', encoding='utf-8') as fh:
    json.dump(report, fh, ensure_ascii=False, indent=1)

print(json.dumps(report['summary'], ensure_ascii=False, indent=2))
print('--- uiStats ---')
print(json.dumps(report['uiStats'], ensure_ascii=False, indent=2))
print('--- protected components ---')
for i in inventory:
    if 'protected-input' in i['tags']:
        print(f"{i['loc']:>5} LOC  {i['file']}  inputs={i['inputs']} validate={i['hasValidation']}")
print('--- storage keys ---')
for k, v in sorted(storage_names.items()):
    print(f"{k}  decl={v['declaredIn']}  R={len(v['reads'])} W={len(v['writes'])}")
print('--- unreachable files ---')
for i in inventory:
    if not i['reachableFromEntry']:
        print(f"{i['loc']:>5} LOC  {i['file']}")
