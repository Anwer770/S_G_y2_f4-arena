#!/usr/bin/env python3
"""
قياس استجابة الجداول (Phase 4 · البند: 35 جدولاً في 31 ملفاً).

لكل جدول يقيس:
  • عدد الأعمدة (من صف الرأس)
  • هل له سلف بحاوية تمرير أفقية (`overflow-x-auto`)؟
  • هل له عرض أدنى (`min-w-[...]`) يمنع سحق الأعمدة على الجوال؟
  • هل له تصفير للطباعة (`print:min-w-0`) كي لا يُقصّ على الورق؟
  • هل الملف محمي (46) أم كود ميت؟

المخرجات: جدول + `docs/تدقيق/tables-coverage.json`
الاستخدام: python3 tools/audit/tables_audit.py [--json]
"""
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
AUDIT = os.path.join(ROOT, 'docs', 'تدقيق')

DIV_OPEN = re.compile(r'<div\b([^>]*)>', re.S)
DIV_CLOSE = re.compile(r'</div>')
TABLE = re.compile(r'<table\b([^>]*)>', re.S)
SCROLL = re.compile(r'overflow-x-auto')
MINW = re.compile(r'min-w-\[(\d+)px\]')
PRINT_RESET = re.compile(r'print:min-w-0')
CLASS_ATTR = re.compile(r'className\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|"([^"]*)")', re.S)


def attrs_of(raw):
    m = CLASS_ATTR.search(raw)
    return (m.group(1) or m.group(2) or m.group(3) or '') if m else ''


def classify(path, text):
    """يعيد قائمة الجداول في ملف مع حالة الحاوية والعرض."""
    dead = False
    protected = False
    inv_path = os.path.join(AUDIT, 'inventory.json')
    if os.path.exists(inv_path):
        with open(inv_path, encoding='utf-8') as fh:
            for r in json.load(fh)['inventory']:
                if os.path.normpath(os.path.join(ROOT, r['file'])) == os.path.normpath(path):
                    dead = not r['reachableFromEntry']
    prot_path = os.path.join(AUDIT, 'protectedContracts.json')
    if os.path.exists(prot_path):
        with open(prot_path, encoding='utf-8') as fh:
            for r in json.load(fh):
                if os.path.normpath(os.path.join(ROOT, r['file'])) == os.path.normpath(path):
                    protected = True

    # مكدّس حاويات div: نتتبّع هل أي سلف مفتوح يحمل overflow-x-auto
    events = []
    for m in DIV_OPEN.finditer(text):
        events.append((m.start(), 'open', SCROLL.search(attrs_of(m.group(1))) is not None))
    for m in DIV_CLOSE.finditer(text):
        events.append((m.start(), 'close', False))
    events.sort(key=lambda e: e[0])

    rows = []
    stack = [False]  # خارج أي div
    idx = 0
    for m in TABLE.finditer(text):
        while idx < len(events) and events[idx][0] < m.start():
            _, kind, is_scroll = events[idx]
            if kind == 'open':
                stack.append(is_scroll or stack[-1])
            elif len(stack) > 1:
                stack.pop()
            idx += 1
        cls = attrs_of(m.group(1))
        head_end = text.find('</thead>', m.start())
        head = text[m.start():head_end] if 0 < head_end < m.start() + 20000 else text[m.start():m.start() + 4000]
        cols = len(re.findall(r'<th\b', head))
        rows.append({
            'file': os.path.relpath(path, ROOT),
            'line': text[:m.start()].count('\n') + 1,
            'columns': cols,
            'hasScrollAncestor': stack[-1],
            'minWidth': (MINW.search(cls).group(1) + 'px') if MINW.search(cls) else None,
            'printReset': bool(PRINT_RESET.search(cls)),
            'tableClass': ' '.join(cls.split())[:110],
            'protected': protected,
            'dead': dead,
        })
    return rows


def main():
    rows = []
    for dp, _dn, fn in os.walk(SRC):
        for f in sorted(fn):
            if not f.endswith('.tsx'):
                continue
            p = os.path.join(dp, f)
            text = open(p, encoding='utf-8', errors='ignore').read()
            if '<table' in text:
                rows.extend(classify(p, text))

    live = [r for r in rows if not r['dead']]
    print(f"جداول: {len(rows)} في {len({r['file'] for r in rows})} ملفاً · حيّة: {len(live)}")
    no_scroll = [r for r in live if not r['hasScrollAncestor']]
    no_minw = [r for r in live if not r['minWidth']]
    no_reset = [r for r in live if r['minWidth'] and not r['printReset']]
    print(f"بلا حاوية تمرير : {len(no_scroll)}")
    print(f"بلا عرض أدنى    : {len(no_minw)}")
    print(f"بلا تصفير طباعة : {len(no_reset)}")
    cols = {}
    for r in live:
        cols.setdefault(r['columns'], 0)
        cols[r['columns']] += 1
    print("توزيع الأعمدة   : " + ' · '.join(f'{k} أعمدة: {v}' for k, v in sorted(cols.items())))
    print("\nتفصيل الحيّة:")
    print(f"{'الملف':<48}{'أعمدة':>6}{'تمرير':>7}{'min-w':>9}{'طباعة':>7}{'محمي':>6}")
    for r in sorted(live, key=lambda r: (r['hasScrollAncestor'], r['file'])):
        print(f"{r['file'].replace('src/components/', ''):<48}{r['columns']:>6}"
              f"{('✔' if r['hasScrollAncestor'] else '✖'):>7}"
              f"{(r['minWidth'] or '—'):>9}"
              f"{('✔' if r['printReset'] else '✖'):>7}"
              f"{('✔' if r['protected'] else ''):>6}")

    if '--assert' in sys.argv:
        bad = 0
        if no_scroll:
            bad += len(no_scroll)
            print('\n✖ جداول بلا حاوية تمرير أفقية:')
            for r in no_scroll:
                print(f"   {r['file']}:{r['line']} ({r['columns']} أعمدة)")
        if no_minw:
            bad += len(no_minw)
            print('\n✖ جداول بلا عرض أدنى:')
            for r in no_minw:
                print(f"   {r['file']}:{r['line']} ({r['columns']} أعمدة)")
        if no_reset:
            bad += len(no_reset)
            print('\n✖ جداول بعرض أدنى بلا print:min-w-0 (خطر قصّ على الورق):')
            for r in no_reset:
                print(f"   {r['file']}:{r['line']}")
        if bad:
            print(f'\n✖ فشل: {bad} مخالفة')
            return 1
        print(f'\n✔ كل الجداول الحيّة ({len(live)}) داخل حاوية تمرير · بعرض أدنى · بتصفير طباعة')

    if '--json' in sys.argv:
        data = {
            'total': len(rows), 'live': len(live),
            'withoutScroll': len(no_scroll), 'withoutMinWidth': len(no_minw),
            'withoutPrintReset': len(no_reset),
            'columnsHistogram': {str(k): v for k, v in sorted(cols.items())},
            'tables': rows,
        }
        with open(os.path.join(AUDIT, 'tables-coverage.json'), 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=1)
        print("\nتقرير: docs/تدقيق/tables-coverage.json")
    return 0


if __name__ == '__main__':
    sys.exit(main())
