#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تدقيق المرحلة 0 — الجزء الثالث: عقد البيانات الفعلي للمكونات المحمية.
يستخرج لكل مكوّن إدخال:
  - حقول الحالة (useState) = الحقول الوظيفية
  - مفاتيح كائن الحفظ المُرسَل إلى onSave/onSubmit = Data Contract الفعلي
  - قوائم options الثابتة المستخدمة
"""
import json, os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'docs', 'تدقيق')

PROT_RE = re.compile(r'(Modal|Form|Drawer|Dialog|Wizard|Editor|Sheet)', re.I)

def read(p):
    with open(p, encoding='utf-8', errors='ignore') as f:
        return f.read()

result = []
for dp, dn, fn in os.walk(SRC):
    for f in sorted(fn):
        if not f.endswith('.tsx') or not PROT_RE.search(f):
            continue
        path = os.path.join(dp, f)
        s = read(path)
        fields = re.findall(r'const\s+\[(\w+),\s*set\w+\]\s*=\s*useState', s)
        # payload passed to onSave/onSubmit/onConfirm — object literal keys
        payloads = {}
        for m in re.finditer(r'(onSave|onSubmit|onConfirm|handleSave|handleSubmit)\s*\(\s*\{(.*?)\}\s*\)', s, re.S):
            keys = re.findall(r'^\s*([a-zA-Z_][\w]*)\s*[:,]', m.group(2), re.M)
            if keys:
                payloads.setdefault(m.group(1), sorted(set(keys)))
        # also spread-style payloads: onSave({ ...record, field: x })
        spreads = re.findall(r'(onSave|onSubmit|onConfirm)\s*\(\s*\{\s*\.\.\.(\w+)', s)
        options = re.findall(r'<(?:select|option)[^>]*>', s)
        errors = re.findall(r"(?:error|errors)\s*(?:===|!==|&&|\?)\s*[^\n;]{0,60}", s)
        result.append({
            'component': f.replace('.tsx', ''),
            'file': os.path.relpath(path, ROOT).replace(os.sep, '/'),
            'loc': sum(1 for _ in open(path, encoding='utf-8', errors='ignore')),
            'stateFields': fields,
            'stateFieldCount': len(fields),
            'savePayloads': payloads,
            'spreadPayloads': sorted(set(sp[0] + '(...' + sp[1] + ')' for sp in spreads)),
            'optionElements': len(options),
            'validationHints': len(errors),
        })

result.sort(key=lambda r: -r['loc'])
os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, 'protectedContracts.json'), 'w', encoding='utf-8') as fh:
    json.dump(result, fh, ensure_ascii=False, indent=1)

print(f"components analysed: {len(result)}")
for r in result:
    keys = list(r['savePayloads'].values())
    n = len(keys[0]) if keys else 0
    print(f"{r['loc']:>5} LOC {r['component']:<30} fields={r['stateFieldCount']:<3} payloadKeys={n:<3} spread={len(r['spreadPayloads'])}")
print()
print("=== sample: CustomerModal ===")
for r in result:
    if r['component'] == 'CustomerModal':
        print(json.dumps(r, ensure_ascii=False, indent=1))
print("=== sample: FinancialModal ===")
for r in result:
    if r['component'] == 'FinancialModal':
        print(json.dumps(r, ensure_ascii=False, indent=1))
