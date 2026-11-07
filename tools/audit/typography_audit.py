#!/usr/bin/env python3
"""
قياس أحجام النصوص في الواجهة (Phase 4 · البند: النص 8–11px).

يقيس استخدامات الأحجام المطلقة `text-[Npx]` ويصنّفها:
  • أصغر من 12px  ⇒ نص أصغر من سلّم التطبيق المعتمد (`text-xs` = 12px، المستخدم في 1775 موضعاً)
  • داخل صندوق ثابت أصغر من 20px (w-4/h-4) ⇒ استثناء مقصود يبقى 11px

المخرجات: جدول + `docs/تدقيق/typography-coverage.json`
الاستخدام: python3 tools/audit/typography_audit.py [--json]
"""
import collections
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from class_strings import iter_class_strings  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
AUDIT = os.path.join(ROOT, 'docs', 'تدقيق')
FLOOR = 12.0          # الحد المعياري = سلّم التطبيق نفسه (text-xs)
HARD_EXCEPTION = 11.0  # أرضية الصندوق الثابت الصغير

SIZE_RE = re.compile(r'^(?P<variant>(?:[a-z-]+:)*)text-\[(?P<px>\d+(?:\.\d+)?)px\]$')
NAMED = re.compile(r'^(?:[a-z-]+:)*text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$')
# نفس تعريف أداة التحويل: صندوق ثابت أصغر من 20px يحمل نصاً مصغّراً
SMALL_BOX = re.compile(r'\b(?:w|h|size)-(?:0\.5|1|1\.5|2|2\.5|3|3\.5|4|4\.5)\b|min-w-\[1[0-9]px\]|\bh-4\b')


def audit_sources():
    sizes = collections.Counter()
    per_module = collections.Counter()
    per_file = collections.Counter()
    small_box_hits = []
    files = set()
    for dp, _dn, fn in os.walk(SRC):
        for f in sorted(fn):
            if not f.endswith(('.tsx', '.jsx', '.ts')):
                continue
            path = os.path.join(dp, f)
            rel = os.path.relpath(path, ROOT)
            try:
                text = open(path, encoding='utf-8', errors='ignore').read()
            except OSError:
                continue
            for _pos, body in iter_class_strings(text):
                toks = body.split()
                for tok in toks:
                    m = SIZE_RE.match(tok)
                    if not m:
                        continue
                    px = float(m.group('px'))
                    sizes[px] += 1
                    files.add(rel)
                    per_file[rel] += 1
                    parts = rel.split(os.sep)
                    per_module[parts[2] if len(parts) > 2 else rel] += 1
                    if px < FLOOR and not SMALL_BOX.search(body):
                        small_box_hits.append({'file': rel, 'px': px, 'class': ' '.join(toks)[:120]})
    total = sum(sizes.values())
    below = sum(c for px, c in sizes.items() if px < FLOOR)
    below_hard = sum(c for px, c in sizes.items() if px < HARD_EXCEPTION)
    return {
        'totalArbitrary': total,
        'belowFloor': below,
        'belowHardFloor': below_hard,
        'minSize': min(sizes) if sizes else None,
        'bySize': {str(k): v for k, v in sorted(sizes.items())},
        'perModule': dict(per_module.most_common()),
        'perFile': dict(per_file.most_common()),
        'filesTouched': len(files),
        'violationsOutsideSmallBox': small_box_hits,
        'floor': FLOOR,
        'hardFloor': HARD_EXCEPTION,
    }


def main():
    data = audit_sources()
    print(f"{'الحجم':>9}{'العدد':>9}   الحالة")
    for px, cnt in sorted(((float(k), v) for k, v in data['bySize'].items())):
        state = ('صغير جداً' if px < 10 else 'دون الحد المعياري') if px < FLOOR else ('الحد المعياري (مقبول)' if px == FLOOR else '')
        print(f"{px:>8}px{cnt:>9}   {state}")
    print('-' * 44)
    print(f"{'المجموع':>9}{data['totalArbitrary']:>9}")
    print(f"تحت {FLOOR:.0f}px      : {data['belowFloor']} في {data['filesTouched']} ملفاً")
    print(f"تحت {HARD_EXCEPTION:.0f}px        : {data['belowHardFloor']}")
    print(f"أصغر حجم مستخدم : {data['minSize']}px")
    top = list(data['perModule'].items())[:6]
    print('أعلى الوحدات    : ' + ' · '.join(f'{k} {v}' for k, v in top))
    if data['violationsOutsideSmallBox']:
        print(f"\nمخالفات خارج الصندوق الصغير: {len(data['violationsOutsideSmallBox'])}")
        for v in data['violationsOutsideSmallBox'][:5]:
            print(f"   {v['file']}: {v['px']}px · {v['class'][:80]}")
    if '--json' in sys.argv:
        os.makedirs(AUDIT, exist_ok=True)
        with open(os.path.join(AUDIT, 'typography-coverage.json'), 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=1)
        print(f"\nتقرير: docs/تدقيق/typography-coverage.json")
    return 0 if data['belowHardFloor'] == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
