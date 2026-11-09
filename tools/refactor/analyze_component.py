#!/usr/bin/env python3
"""أداة تفكيك مساعدة (R30): تستخرج «منطق» مكوّن إلى خطاف مستقل وتعيد قائمة الأسماء المطلوبة.

لا تُشحن مع التطبيق — تُستخدم يدوياً أثناء التفكيك فقط (خارج src).
"""
import re
import sys

ARGS = {'React', 'true', 'false', 'null', 'undefined', 'return', 'const', 'let', 'var', 'if', 'else'}


def strip_literals(txt: str) -> str:
    txt = re.sub(r'\{/\*.*?\*/\}', '', txt, flags=re.S)
    txt = re.sub(r'/\*.*?\*/', '', txt, flags=re.S)
    txt = re.sub(r'//[^\n]*', '', txt)
    txt = re.sub(r'"(?:[^"\\]|\\.)*"', '""', txt)
    txt = re.sub(r"'(?:[^'\\]|\\.)*'", "''", txt)
    txt = re.sub(r'`(?:[^`\\]|\\.)*`', '``', txt)
    return txt


def declared(logic: str):
    names = set()
    for m in re.finditer(r'^\s*(?:export\s+)?(?:const|let)\s*\[\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)', logic, re.M):
        names.update([m.group(1), m.group(2)])
    for m in re.finditer(r'^\s*(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*[:=]', logic, re.M):
        names.add(m.group(1))
    for m in re.finditer(r'^\s*(?:export\s+)?function\s+([A-Za-z_$][\w$]*)', logic, re.M):
        names.add(m.group(1))
    return names


def used_in(txt: str):
    txt = strip_literals(txt)
    out = set()
    for m in re.finditer(r'(?<![.\w$])([A-Za-z_$][\w$]*)', txt):
        out.add(m.group(1))
    return out


def analyze(path: str, logic_start: int, logic_end: int, jsx_start: int, jsx_end: int):
    lines = open(path, encoding='utf-8').read().split('\n')
    logic = '\n'.join(lines[logic_start - 1:logic_end])
    jsx = '\n'.join(lines[jsx_start - 1:jsx_end])
    decl = declared(logic)
    used = used_in(jsx)
    return sorted(decl & used), sorted(decl - used)


if __name__ == '__main__':
    p, a, b, c, d = sys.argv[1], *map(int, sys.argv[2:6])
    need, unused = analyze(p, a, b, c, d)
    print('NEEDED (%d):' % len(need))
    print('  ' + ', '.join(need))
    print('UNUSED (%d):' % len(unused))
    print('  ' + ', '.join(unused))
