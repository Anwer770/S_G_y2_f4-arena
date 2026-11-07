#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
قياس تغطية الوضع الليلي (Dark-mode coverage) لكل وحدة.

المقياس: نسبة أصناف Tailwind اللونية المصحوبة بمقابل `dark:`
        = dark: / (أصناف لونية تحتاج مقابلاً)
لا تُعدّ الأصناف المحايدة (flex, p-4, ...) ولا الأصناف التي لا تحتاج مقابلاً
مثل bg-transparent و text-white على خلفية داكنة ثابتة داخل المكوّن نفسه.

الاستخدام:
  python3 tools/audit/darkmode_coverage.py            # تقرير نصي
  python3 tools/audit/darkmode_coverage.py --json      # مخرجات JSON
"""
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')

# الأصناف اللونية التي تحتاج مقابلاً ليلياً
NEEDS_DARK = re.compile(
    r'\b(?!dark:)'
    r'(?:[a-z-]+:)*'                                   # variant prefixes (hover:, md:, ...)
    r'(?:bg|text|border|divide|ring|from|to|via|fill|stroke|placeholder|decoration)-'
    r'(?:white|black'
    r'|slate|gray|zinc|neutral|stone'
    r'|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
    r')'
    r'(?:-\d{2,3})?(?:/\d+)?\b'
)
# أصناف لا تحتاج مقابلاً (محايدة أو مقصودة)
EXEMPT = re.compile(
    r'\b(?:bg-transparent|bg-current|text-inherit|text-current|bg-black/|border-transparent'
    r'|bg-gradient|text-white\b|border-white/)\b'
)
TOKEN_RE = re.compile(r'[^\s"\'`{}]+')


def module_of(path):
    rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
    if '/components/' in rel:
        return rel.split('/components/')[1].split('/')[0]
    if '/app/' in rel:
        return '(app shell)'
    return '(core/utils)'


def scan():
    stats = {}
    per_file = {}
    for dp, dn, fn in os.walk(SRC):
        for f in sorted(fn):
            if not f.endswith(('.ts', '.tsx')):
                continue
            path = os.path.join(dp, f)
            rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
            with open(path, encoding='utf-8', errors='ignore') as fh:
                text = fh.read()
            needs = 0
            dark = 0
            for m in re.finditer(r'className\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|\{`([^`]*)`\})', text, re.S):
                body = m.group(1) or m.group(2) or m.group(3) or ''
                tokens = set(TOKEN_RE.findall(body))
                dark += sum(1 for t in tokens if t.startswith('dark:'))
                for t in tokens:
                    if t.startswith('dark:') or EXEMPT.search(t):
                        continue
                    if NEEDS_DARK.fullmatch(t):
                        needs += 1
            if needs or dark:
                mod = module_of(path)
                s = stats.setdefault(mod, {'dark': 0, 'needs': 0})
                s['dark'] += dark
                s['needs'] += needs
                per_file[rel] = {'dark': dark, 'needs': needs}
    return stats, per_file


def main():
    stats, per_file = scan()
    rows = []
    for mod, s in sorted(stats.items(), key=lambda kv: (kv[1]['dark'] / max(kv[1]['needs'], 1))):
        ratio = s['dark'] / max(s['needs'], 1)
        rows.append({'module': mod, 'dark': s['dark'], 'needs': s['needs'], 'coverage': round(ratio, 3)})
    total_dark = sum(r['dark'] for r in rows)
    total_needs = sum(r['needs'] for r in rows)
    summary = {
        'totalDark': total_dark,
        'totalNeeds': total_needs,
        'coverage': round(total_dark / max(total_needs, 1), 3),
        'modules': rows,
    }
    if '--json' in sys.argv:
        out = os.path.join(ROOT, 'docs', 'تدقيق', 'darkmode-coverage.json')
        with open(out, 'w', encoding='utf-8') as fh:
            json.dump({'summary': summary, 'perFile': per_file}, fh, ensure_ascii=False, indent=1)
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return
    print(f"{'الوحدة':<22}{'dark:':>8}{'تحتاج':>8}{'التغطية':>10}")
    print('-' * 50)
    for r in rows:
        print(f"{r['module']:<22}{r['dark']:>8}{r['needs']:>8}{r['coverage']*100:>9.0f}%")
    print('-' * 50)
    print(f"{'الإجمالي':<22}{total_dark:>8}{total_needs:>8}{summary['coverage']*100:>9.0f}%")


if __name__ == '__main__':
    main()
