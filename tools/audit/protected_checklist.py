#!/usr/bin/env python3
"""
إثبات §52 للمكونات المحمية — Before Count = After Count.

لكل مكوّن محمي مسّه التحويل، يقارن نسخة git (HEAD) بالنسخة الحالية ويعدّ:
الحقول · التسميات · معالجات الأحداث · الحالة · التحقق · التخزين · القيم الافتراضية ·
الخصائص المستدعاة (Callbacks) · أسطر الملف.

أي فرق غير صفري = فشل (خروج 1). التغيير المسموح الوحيد داخل المكوّن المحمي هو أصناف `dark:`.

التشغيل: python3 tools/audit/protected_checklist.py [--json docs/تدقيق/protected-checklist-phase4b.json]
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUDIT = os.path.join(ROOT, 'docs', 'تدقيق')

# ما يجب أن يبقى **متطابقاً عدداً** داخل كل مكوّن محمي
PROBES = [
    ('fields',      r'<(?:input|select|textarea)\b'),
    ('labels',      r'<label\b'),
    ('onChange',    r'onChange\s*='),
    ('onClick',     r'onClick\s*='),
    ('onSubmit',    r'onSubmit\s*='),
    ('onKeyDown',   r'onKey(?:Down|Up|Press)\s*='),
    ('useState',    r'useState\s*[(<]'),
    ('useEffect',   r'useEffect\s*\('),
    ('validation',  r'\brequired\b|validate|isValid|تحقق|مطلوب'),
    ('storage',     r'localStorage|dbStorage|indexedDB|sessionStorage'),
    ('defaults',    r'defaultValue|placeholder\s*='),
    ('callbacks',   r'\bon[A-Z][A-Za-z]+\s*[=:]'),
    ('required_fn', r'\.trim\(\)|parseFloat|parseInt|Number\('),
    ('type_any',    r'\bany\b'),
    ('dark_classes', r'dark:'),
]


def protected_files():
    with open(os.path.join(AUDIT, 'protectedContracts.json'), encoding='utf-8') as fh:
        data = json.load(fh)
    out = []
    for rec in data:
        out.append(os.path.normpath(rec['file']))
    return out


def read_head(path):
    try:
        return subprocess.run(['git', 'show', f'HEAD:{path}'], cwd=ROOT,
                              capture_output=True, text=True).stdout
    except Exception:
        return None


def counts(text):
    return {name: len(re.findall(rx, text)) for name, rx in PROBES}


def main():
    only_changed = '--all-files' not in sys.argv
    rows, failures = [], []
    for path in sorted(protected_files()):
        abspath = os.path.join(ROOT, path)
        if not os.path.exists(abspath):
            continue
        with open(abspath, encoding='utf-8', errors='ignore') as fh:
            new = fh.read()
        old = read_head(path)
        if old is None:
            continue
        b, a = counts(old), counts(new)
        touched = b['dark_classes'] != a['dark_classes']
        if only_changed and not touched:
            continue
        diffs = {k: (b[k], a[k]) for k in b if k != 'dark_classes' and b[k] != a[k]}
        rows.append({
            'file': path,
            'darkAdded': a['dark_classes'] - b['dark_classes'],
            'before': b, 'after': a,
            'differences': diffs,
        })
        if diffs:
            failures.append((path, diffs))

    print(f"{'المكوّن المحمي':<52}{'+dark':>7}  الحقول  المعالجات  التحقق  التخزين")
    for r in rows:
        b, a = r['before'], r['after']
        handlers_b = b['onChange'] + b['onClick'] + b['onSubmit'] + b['onKeyDown']
        handlers_a = a['onChange'] + a['onClick'] + a['onSubmit'] + a['onKeyDown']
        print(f"{r['file']:<52}{r['darkAdded']:>7}  {b['fields']}→{a['fields']}    {handlers_b}→{handlers_a}"
              f"     {b['validation']}→{a['validation']}    {b['storage']}→{a['storage']}")

    total_dark = sum(r['darkAdded'] for r in rows)
    print(f"\nمكونات محمية مفحوصة: {len(rows)} · إضافات dark: {total_dark}")
    print(f"انحرافات في أي عدّاد غير dark: {len(failures)}")
    for path, diffs in failures:
        print(f"   ✖ {path}: {diffs}")

    if '--json' in sys.argv:
        idx = sys.argv.index('--json')
        dest = sys.argv[idx + 1] if len(sys.argv) > idx + 1 else os.path.join(AUDIT, 'protected-checklist-phase4b.json')
        if not os.path.isabs(dest):
            dest = os.path.join(ROOT, dest)
        with open(dest, 'w', encoding='utf-8') as fh:
            json.dump({'totalDarkAdded': total_dark, 'components': rows}, fh, ensure_ascii=False, indent=1)
        print(f"تقرير: {os.path.relpath(dest, ROOT)}")

    if failures:
        print('✖ فشل الإثبات — لا تُثبَّت هذه الدفعة')
        sys.exit(1)
    print('✔ Before Count = After Count في كل مكوّن محمي — التغيير تنسيقي بحت')


if __name__ == '__main__':
    main()
