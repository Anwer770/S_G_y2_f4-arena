#!/usr/bin/env python3
"""
ماسح مشترك لسلاسل الأصناف (className) — يُستخدمه كودمود التحويل وأدوات القياس.

يوفّر:
  • CLASSNAME_RE       : يطابق className="..." و className='...' و className={`...`}
  • split_template()   : يفصل القالب النصي إلى (نص | تعبير ${...}) بأقواس متوازنة
  • map_class_string() : يطبّق دالة تحويل على المقاطع النصية فقط، ويحفظ المسافات الطرفية
                         حرفياً حتى لا يُدمج صنف ثابت مع تعبير ${...} مجاور
  • iter_class_strings(): يمرّ على كل سلاسل الأصناف في نص مصدري
"""
import re

CLASSNAME_RE = re.compile(
    r'(className\s*=\s*)'
    r'(?:"([^"]*)"'
    r"|'([^']*)'"
    r'|\{(`[^`]*`)\})',
    re.S,
)


def split_template(raw):
    """يقسّم جسم قالب نصي إلى قائمة (is_expression, fragment) بأقواس متوازنة."""
    parts, i, n, start = [], 0, len(raw), 0
    while i < n:
        if raw[i] == '$' and i + 1 < n and raw[i + 1] == '{':
            if i > start:
                parts.append((False, raw[start:i]))
            depth, j = 1, i + 2
            while j < n and depth:
                if raw[j] == '{':
                    depth += 1
                elif raw[j] == '}':
                    depth -= 1
                j += 1
            parts.append((True, raw[i:j]))
            i = start = j
        else:
            i += 1
    if start < n:
        parts.append((False, raw[start:]))
    return parts


def map_class_string(text, transform):
    """
    يمرّ على كل سلاسل الأصناف في `text` ويستبدل كل سلسلة بـ transform(body) -> (جديد, n).

    • المقاطع النصية فقط هي التي تُمرَّر إلى transform (تعبيرات ${...} تبقى حرفية).
    • المسافات الطرفية تُحفظ كما هي لمنع دمج صنف مجاور بتعبير.
    يعيد (نص جديد, مجموع n).
    """
    total = 0

    def repl(m):
        nonlocal total
        head, dq, sq, tpl = m.group(1), m.group(2), m.group(3), m.group(4)
        if tpl is not None:
            raw = tpl[1:-1]
            out = []
            for is_expr, frag in split_template(raw):
                if is_expr:
                    out.append(frag)
                else:
                    new, n = transform(frag)
                    total += n
                    out.append(new)
            return f'{head}{{`{"".join(out)}`}}'
        body = dq if dq is not None else sq
        quote = '"' if dq is not None else "'"
        new, n = transform(body)
        total += n
        return f'{head}{quote}{new}{quote}'

    return CLASSNAME_RE.sub(repl, text), total


def process_tokens(body, token_fn):
    """يطبّق token_fn على أصناف الجسم مع حفظ المسافات الطرفية. يعيد (جديد, عدد)."""
    if not body.strip():
        return body, 0
    lead = body[:len(body) - len(body.lstrip())]
    trail = body[len(body.rstrip()):]
    out, n = [], 0
    for tok in body.split():
        new, k = token_fn(tok)
        out.append(new)
        n += k
    if n == 0:
        return body, 0
    return lead + ' '.join(out) + trail, n


def iter_class_strings(text):
    """يولّد أجسام سلاسل الأصناف (نصية + مقاطع القوالب النصية) مع موضعها."""
    for m in CLASSNAME_RE.finditer(text):
        body = m.group(2) if m.group(2) is not None else m.group(3)
        if body is not None:
            yield m.start(), body
            continue
        tpl = m.group(4)[1:-1]
        pos = m.start()
        for is_expr, frag in split_template(tpl):
            if not is_expr:
                yield pos, frag
            pos += len(frag)
