#!/usr/bin/env python3
"""
كودمود أحجام النصوص — يرفع كل نص أصغر من 12px إلى سلّم التطبيق المعتمد.

القاعدة (لا شيء غيرها):
  • `text-[Npx]` حيث N < 12  ⟶  `text-xs`   (12px = الحجم المصغّر المعتمد في 1775 موضعاً)
  • استثناء واحد: إن كان العنصر صندوقاً ثابتاً أصغر من 20px (w-4/h-4 وأصغر) ⇒ `text-[11px]`
    لأن 12px مع ارتفاع السطر 16px لا يتّسع في دائرة 16px (شارات العدّادات).
  • لا يُمسّ `text-[12px]` أو أكبر، ولا أي صنف آخر، ولا أي بايت خارج سلاسل الأصناف.

idempotent: تشغيل ثانٍ = 0 تغييرات.
الاستخدام:
  python3 tools/audit/typography_codemod.py --dry-run
  python3 tools/audit/typography_codemod.py
"""
import collections
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from class_strings import iter_class_strings, map_class_string, process_tokens  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
AUDIT = os.path.join(ROOT, 'docs', 'تدقيق')
DRY = '--dry-run' in sys.argv
FLOOR = 12.0
SMALL_BOX_TARGET = 'text-[11px]'

SIZE_RE = re.compile(r'^(?P<variant>(?:[a-z-]+:)*)text-\[(?P<px>\d+(?:\.\d+)?)px\]$')
# صندوق ثابت أصغر من 20px (w-4 = 16px وأصغر)
SMALL_BOX = re.compile(r'\b(?:w|h|size)-(?:0\.5|1|1\.5|2|2\.5|3|3\.5|4|4\.5)\b|min-w-\[1[0-9]px\]|\bh-4\b')


def transform_body(body):
    """يطبّق القاعدة على جسم سلسلة أصناف. يعيد (جسم جديد, عدد التغييرات, التفاصيل)."""
    details = []
    small = bool(SMALL_BOX.search(body))

    def token_fn(tok):
        m = SIZE_RE.match(tok)
        if not m:
            return tok, 0
        px = float(m.group('px'))
        if px >= FLOOR:
            return tok, 0
        target = SMALL_BOX_TARGET if small else 'text-xs'
        if target == tok:  # مستقرّ على الأرضية الاستثنائية (صندوق صغير)
            return tok, 0
        details.append({'from': f'text-[{m.group("px")}px]', 'to': target})
        return target, 1

    new, n = process_tokens(body, token_fn)
    return new, n, details


def main():
    changed_files, all_details = [], []
    total = 0
    for dp, _dn, fn in os.walk(SRC):
        for f in sorted(fn):
            if not f.endswith(('.tsx', '.jsx')):
                continue
            path = os.path.join(dp, f)
            rel = os.path.relpath(path, ROOT)
            text = open(path, encoding='utf-8', errors='ignore').read()
            details = []

            def body_fn(body):
                new, n, det = transform_body(body)
                details.extend(det)
                return new, n

            new_text, n = map_class_string(text, body_fn)
            if n == 0:
                continue
            # حارس السلامة: لا تغيير خارج سلاسل الأصناف
            stripped_old = map_class_string(text, lambda b: ('', 0))[0]
            stripped_new = map_class_string(new_text, lambda b: ('', 0))[0]
            if stripped_old != stripped_new:
                print(f'✖ تخطّي (تجاوز محتمل خارج الأصناف): {rel}')
                continue
            changed_files.append({'file': rel, 'changes': n})
            all_details.extend(details)
            total += n
            if not DRY:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new_text)

    by_pair = collections.Counter((d['from'], d['to']) for d in all_details)
    prefix = '(معاينة) ' if DRY else ''
    print(f"{prefix}ملفات متأثرة: {len(changed_files)} · تغييرات: {total}")
    print('-' * 56)
    for (src, dst), cnt in by_pair.most_common():
        print(f"  {cnt:>5}  {src:>14}  ⟶  {dst}")
    for c in sorted(changed_files, key=lambda x: -x['changes'])[:8]:
        print(f"  {c['changes']:>5}  {c['file']}")

    if '--json' in sys.argv:
        os.makedirs(AUDIT, exist_ok=True)
        name = 'typography-codemod-report.json'
        with open(os.path.join(AUDIT, name), 'w', encoding='utf-8') as fh:
            json.dump({'dryRun': DRY, 'status': 'معاينة' if DRY else 'منفَّذ',
                       'files': len(changed_files), 'changes': total,
                       'byPair': {f'{k[0]} -> {k[1]}': v for k, v in by_pair.items()},
                       'details': changed_files}, fh, ensure_ascii=False, indent=1)
        print(f"تقرير: docs/تدقيق/{name}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
