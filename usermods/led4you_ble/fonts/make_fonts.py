# Builds l4yf0..4.wbf: WLED's five built-in Scrolling Text fonts plus accented letters and emoji
# (Unicode Private Use Area U+E000.., the LED4YOU app converts the message before sending it).
import re, sys, json
FONTDIR = '/home/claude/led4you/wled00/src/font/'
FONTS = ['font_tom_thumb_6px', 'font_TinyUnicode_8px', 'console_font_6x8', 'c64esque_9px', 'font_5x12']
ACC = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ'
exec(open('emoji.py').read())
import unicodedata

def load(name):
    s = open(FONTDIR + name + '.h').read()
    body = s[s.index('PROGMEM = {') + 11: s.index('};', s.index('PROGMEM = {'))]
    body = re.sub(r'/\*.*?\*/', '', body, flags=re.S); body = re.sub(r'//[^\n]*', '', body)
    b = [int(x, 16) for x in re.findall(r'0x[0-9A-Fa-f]{1,2}', body)]
    h, w, sp, fl, first, last = b[1], b[2], b[3], b[4], b[5], b[6]
    n = last - first + 1
    p = 12
    widths = b[p:p + n] if fl & 1 else [w] * n
    if fl & 1: p += n
    glyphs = {}
    for i in range(n):
        gw = widths[i]; bits = gw * h; nb = (bits + 7) // 8
        data = b[p:p + nb]; p += nb
        g = [[(data[(r * gw + c) >> 3] >> (7 - ((r * gw + c) & 7))) & 1 for c in range(gw)] for r in range(h)]
        glyphs[first + i] = g
    return h, w, sp, glyphs

def marks(kind, w, two):
    c = (w - 1) // 2
    L, R = max(0, c - 1), min(w - 1, c + 1)
    if kind == 'acute': return [[R], [c]] if two else [[R]]
    if kind == 'grave': return [[L], [c]] if two else [[L]]
    if kind == 'circ': return [[c], [L, R]] if two else [[L, c, R]]
    if kind == 'tilde': return [[L + 1 if L + 1 <= R else L, R], [L, c]] if two and w >= 4 else [[L, c, R]]
    if kind == 'diaer': return [[L, R]]
    return []

KIND = {'́': 'acute', '̀': 'grave', '̂': 'circ', '̃': 'tilde', '̈': 'diaer', '̧': 'ced'}

def compose(ch, glyphs, h):
    d = unicodedata.normalize('NFD', ch)
    base, k = d[0], KIND[d[1]]
    g = [row[:] for row in glyphs[ord(base)]]
    w = len(g[0]) if g else 0
    rows = [r for r in range(h) if any(g[r])]
    if not rows or w == 0: return g
    top, bot = rows[0], rows[-1]
    if k == 'ced':
        c = (w - 1) // 2
        if bot + 1 < h: g[bot + 1][c] = 1
        if bot + 2 < h: g[bot + 2][max(0, c - 1)] = 1
        return g
    if top >= 3: m, r0 = marks(k, w, True), top - 3
    elif top == 2: m, r0 = marks(k, w, False), 0
    elif top == 1: m, r0 = marks(k, w, False), 0
    else: return g   # no room above (capitals in the small fonts): plain letter
    if len(m) == 1 and top >= 2: r0 = top - 2
    for i, cols in enumerate(m):
        for c in cols: g[r0 + i][c] = 1
    return g

def emoji_glyph(rows, h):
    src = [[1 if ch == '#' else 0 for ch in r] for r in rows]
    if h < 8:   # shrink to the font height
        s = 8 / h
        src = [[1 if sum(src[min(7, int(y * s + dy))][min(7, int(x * s + dx))] for dy in (0, .5) for dx in (0, .5)) >= 2 else 0 for x in range(h)] for y in range(h)]
    sw = len(src[0]); sh = len(src)
    cols = [c for c in range(sw) if any(src[r][c] for r in range(sh))] or [0]
    src = [r[cols[0]:cols[-1] + 1] for r in src]
    pad = (h - sh) // 2
    w = len(src[0])
    return [[0] * w for _ in range(pad)] + src + [[0] * w for _ in range(h - sh - pad)]

out = {}
for fi, name in enumerate(FONTS):
    h, w, sp, glyphs = load(name)
    order = [glyphs.get(c, [[0] * w for _ in range(h)]) for c in range(32, 127)]
    order.append([[] for _ in range(h)])   # 127: unused (no bitmap)
    for ch in ACC: order.append(compose(ch, glyphs, h))
    for e, rows in EMOJI: order.append(emoji_glyph(rows, h))
    widths = [len(g[0]) if g and g[0] else 0 for g in order]
    last = 32 + len(order) - 1
    assert last <= 255
    hdr = bytes([0x57, h, max(widths), sp, 1, 32, last, 0]) + (0xE000).to_bytes(4, 'little')
    data = bytearray(hdr) + bytes(widths)
    for g, gw in zip(order, widths):
        bits = [v for r in g for v in r[:gw]]
        bb = bytearray((len(bits) + 7) // 8)
        for i, v in enumerate(bits):
            if v: bb[i >> 3] |= 0x80 >> (i & 7)
        data += bb
    open(sys.argv[1] + '/l4yf%d.wbf' % fi, 'wb').write(data)
    out[fi] = len(data)
# the map the app uses: character -> Private Use Area code
m = {ch: 0xE000 + i for i, ch in enumerate(ACC)}
m.update({e: 0xE000 + len(ACC) + i for i, (e, _) in enumerate(EMOJI)})
json.dump({'map': m, 'emoji': [[e, ''.join('%02x' % int(r.replace('#', '1').replace('.', '0'), 2) for r in rows)] for e, rows in EMOJI]}, open(sys.argv[1] + '/map.json', 'w'), ensure_ascii=False)
print(out)
