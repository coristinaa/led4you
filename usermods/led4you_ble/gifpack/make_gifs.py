"""LED4YOU GIF pack: original 16x16 pixel-art animations for LED matrices.
Everything here is drawn from code (no external artwork). Output: gifs/*.gif + gifs/pack.json"""
import json, math, os, random
from PIL import Image

W = H = 16
OUT = os.path.join(os.path.dirname(__file__), 'gifs')
os.makedirs(OUT, exist_ok=True)
PACK = []


def blank(c=(0, 0, 0)):
    return [[c for _ in range(W)] for _ in range(H)]


def put(f, x, y, c):
    if 0 <= x < W and 0 <= y < H and c is not None:
        f[y][x] = c


def sprite(f, rows, pal, ox=0, oy=0):
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.' and ch in pal:
                put(f, ox + x, oy + y, pal[ch])


def scale(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c)


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def save(name, theme, title, frames, ms):
    imgs = []
    for f in frames:
        im = Image.new('RGB', (W, H))
        im.putdata([p for row in f for p in row])
        imgs.append(im.convert('P', palette=Image.ADAPTIVE, colors=64))
    fn = name + '.gif'
    dur = ms if isinstance(ms, list) else [ms] * len(imgs)
    imgs[0].save(os.path.join(OUT, fn), save_all=True, append_images=imgs[1:], duration=dur, loop=0, optimize=False, disposal=1)
    PACK.append({'t': theme, 'n': title, 'f': fn})


random.seed(4)

# ---------------- Halloween ----------------
PUMP = [
    "................",
    ".......gg.......",
    "......gg........",
    "...OOOOoOOOOO...",
    "..OOOOOoOOOOOO..",
    ".OOOOOOoOOOOOOO.",
    ".OOFFOOoOOOFFOO.",
    "OOFFFFOoOOFFFFOO",
    "OOOOOOOoOOOOOOOO",
    "OOOOOOFFFOOOOOOO",
    "OOFOOOOoOOOOOFOO",
    "OOFFFOFFFFOFFFOO",
    ".OOFFFFFFFFFFOO.",
    ".OOOOFOoOOFOOOO.",
    "..OOOOOoOOOOOO..",
    "....OOOOOOOO....",
]
frames = []
for i in range(12):
    f = blank()
    glow = 0.65 + 0.35 * abs(math.sin(i * 1.7)) * (0.6 + 0.4 * random.random())
    sprite(f, PUMP, {'g': (40, 140, 20), 'O': (230, 90, 0), 'o': (150, 50, 0), 'F': scale((255, 210, 40), glow)})
    frames.append(f)
save('hw-pumpkin', 'Halloween', 'Pumpkin', frames, 110)

GHOST_A = [
    "....WWWWWW....",
    "..WWWWWWWWWW..",
    ".WWWWWWWWWWWW.",
    ".WWWKKWWKKWWW.",
    "WWWWKKWWKKWWWW",
    "WWWWWWWWWWWWWW",
    "WWWWWWKKWWWWWW",
    "WWWWWWKKWWWWWW",
    "WWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWW",
    "WW.WWW.WWW.WWW",
    "W...W...W...W.",
]
GHOST_B = GHOST_A[:11] + ["WWW.WWW.WWW.WW", ".W...W...W...W"]
frames = []
for i in range(16):
    f = blank((0, 0, 12))
    dy = round(1.5 * math.sin(i * math.pi / 8))
    sprite(f, GHOST_A if i % 4 < 2 else GHOST_B, {'W': (230, 235, 255), 'K': (10, 10, 30)}, 1, 2 + dy)
    frames.append(f)
save('hw-ghost', 'Halloween', 'Ghost', frames, 90)

BAT_UP = [
    "W.....K..K.....W",
    "WW....KKKK....WW",
    "WWW...KRKR...WWW",
    "WWWW..KKKK..WWWW",
    ".WWWWWKKKKWWWWW.",
    "..WWW.KKKK.WWW..",
    "...W...KK...W...",
]
BAT_DN = [
    "......K..K......",
    "......KKKK......",
    "......KRKR......",
    "....WWKKKKWW....",
    "..WWWWKKKKWWWW..",
    ".WWWW.KKKK.WWWW.",
    "WWW....KK....WWW",
    "W..............W",
]
frames = []
for i in range(8):
    f = blank((5, 0, 20))
    for (x, y) in [(2, 2), (3, 2), (2, 3), (3, 3), (4, 3), (3, 4)]:
        put(f, x, y, (250, 240, 170))   # moon
    dy = 6 + (1 if i % 2 else 0)
    sprite(f, BAT_UP if i % 2 == 0 else BAT_DN, {'W': (60, 40, 70), 'K': (30, 20, 40), 'R': (255, 30, 30)}, 0, dy)
    frames.append(f)
save('hw-bat', 'Halloween', 'Bat', frames, 140)

SPIDER = [
    "K.K..K.K",
    ".K.KK.K.",
    "..KKKK..",
    "KKKRRKKK",
    "..KKKK..",
    ".K.KK.K.",
    "K..KK..K",
]
frames = []
for i in range(16):
    f = blank((0, 0, 0))
    for (x, y) in [(0, 0), (1, 1), (2, 2), (15, 0), (14, 1), (13, 2), (0, 15), (1, 14), (15, 15), (14, 14)]:
        put(f, x, y, (60, 60, 70))     # web corners
    y = int(2 + 7 * (1 - math.cos(i * math.pi / 8)) / 2 * 1.2)
    for t in range(0, y):
        put(f, 8, t, (120, 120, 130))
    sprite(f, SPIDER, {'K': (120, 0, 160), 'R': (255, 0, 0)}, 4, y)
    frames.append(f)
save('hw-spider', 'Halloween', 'Spider', frames, 100)

SKULL = [
    "....WWWWWWWW....",
    "..WWWWWWWWWWWW..",
    ".WWWWWWWWWWWWWW.",
    ".WWWWWWWWWWWWWW.",
    "WWWEEEWWWWEEEWWW",
    "WWWEEEWWWWEEEWWW",
    "WWWEEEWWWWEEEWWW",
    ".WWWWWWWWWWWWWW.",
    "..WWWWWKKWWWWW..",
    "...WWWKKKKWWW...",
    "....WWWWWWWW....",
    "....W.W.W.W.....",
    "....WWWWWWWW....",
    ".....WWWWWW.....",
]
frames = []
for i in range(12):
    f = blank()
    k = 0.25 + 0.75 * (0.5 + 0.5 * math.sin(i * math.pi / 6))
    sprite(f, SKULL, {'W': (220, 220, 210), 'K': (20, 20, 20), 'E': scale((255, 20, 0), k)}, 0, 1)
    frames.append(f)
save('hw-skull', 'Halloween', 'Skull', frames, 100)

POT = [
    ".KKKKKKKKKKKKKK.",
    "KKKKKKKKKKKKKKKK",
    ".KKKKKKKKKKKKKK.",
    ".KKKKKKKKKKKKKK.",
    "..KKKKKKKKKKKK..",
    "...KKKKKKKKKK...",
    "...K........K...",
]
frames = []
bub = [(random.randint(3, 12), random.randint(0, 9), random.choice([1, 1, 2])) for _ in range(7)]
for i in range(16):
    f = blank((4, 0, 10))
    for x in range(3, 13):   # flames
        put(f, x, 15, (255, 80 + 60 * ((x + i) % 3), 0))
    sprite(f, POT, {'K': (40, 40, 50)}, 0, 8)
    for x in range(1, 15):
        put(f, x, 8, (60, 220, 40) if (x + i) % 3 else (150, 255, 90))
    for (bx, by0, sp) in bub:
        by = 7 - ((by0 + i * sp) % 9)
        if by >= 0:
            put(f, bx, by, (90, 255, 60) if by > 3 else (60, 160, 40))
    frames.append(f)
save('hw-cauldron', 'Halloween', 'Cauldron', frames, 110)

frames = []
eyes = [(2, 3, (255, 220, 0)), (10, 2, (255, 40, 0)), (5, 8, (120, 255, 0)), (11, 11, (255, 140, 0)), (1, 12, (200, 0, 255))]
for i in range(20):
    f = blank()
    for k, (x, y, c) in enumerate(eyes):
        ph = (i + k * 4) % 20
        if ph in (0, 1):
            continue                     # blink
        cc = scale(c, 0.6 + 0.4 * ((ph % 5) / 4))
        for dx in (0, 3):
            put(f, x + dx, y, cc); put(f, x + dx + 1, y, cc)
    frames.append(f)
save('hw-eyes', 'Halloween', 'Eyes in the dark', frames, 120)

# ---------------- Christmas ----------------
TREE = [
    ".......S........",
    "......SSS.......",
    ".......G........",
    "......GGG.......",
    ".....GGGGG......",
    "......GGG.......",
    ".....GGGGG......",
    "....GGGGGGG.....",
    ".....GGGGG......",
    "....GGGGGGG.....",
    "...GGGGGGGGG....",
    "..GGGGGGGGGGG...",
    ".GGGGGGGGGGGGG..",
    "......TTT.......",
    "......TTT.......",
]
lights = [(7, 4), (6, 6), (8, 7), (5, 8), (9, 9), (6, 10), (4, 11), (8, 11), (10, 11), (3, 12), (7, 12), (12, 12), (5, 9)]
LC = [(255, 0, 0), (0, 80, 255), (255, 200, 0), (255, 0, 200), (255, 255, 255)]
frames = []
for i in range(12):
    f = blank((0, 0, 8))
    sprite(f, TREE, {'G': (0, 120, 30), 'T': (110, 60, 20), 'S': scale((255, 220, 60), 0.6 + 0.4 * (i % 2))}, 0, 1)
    for k, (x, y) in enumerate(lights):
        on = (i + k) % 3 != 0
        put(f, x, y + 1, LC[(k + i // 3) % 5] if on else (0, 60, 15))
    frames.append(f)
save('xm-tree', 'Christmas', 'Christmas tree', frames, 220)

frames = []
flakes = [(random.randint(0, 15), random.randint(0, 15), random.choice([1, 1, 2])) for _ in range(22)]
for i in range(16):
    f = blank((0, 0, 25))
    for x in range(16):
        put(f, x, 15, (200, 210, 230))
        if (x * 7) % 5 == 0:
            put(f, x, 14, (200, 210, 230))
    for (x, y0, sp) in flakes:
        y = (y0 + i * sp) % 16
        xx = (x + (1 if (i + y) % 6 < 3 else 0)) % 16
        put(f, xx, y, (255, 255, 255) if sp == 2 else (170, 190, 230))
    frames.append(f)
save('xm-snow', 'Christmas', 'Snowfall', frames, 120)

SNOWMAN = [
    ".....KKKK.......",
    ".....KKKK.......",
    "....KKKKKK......",
    ".....WWWW.......",
    "....WKWWKW......",
    "....WWOOWW......",
    ".....WWWW.......",
    "...RRRRRRR......",
    "...WWWWWWWW.....",
    "..WWWWKWWWWW....",
    "..WWWWWWWWWW....",
    "..WWWWKWWWWW....",
    "...WWWWWWWW.....",
]
frames = []
fl = [(random.randint(0, 15), random.randint(0, 15)) for _ in range(10)]
for i in range(12):
    f = blank((0, 5, 30))
    for x in range(16):
        put(f, x, 15, (210, 220, 235))
    sprite(f, SNOWMAN, {'K': (30, 30, 40), 'W': (235, 240, 255), 'O': (255, 120, 0), 'R': (220, 0, 0)}, 2, 2)
    arm = (120, 70, 20)
    for k in range(3):
        put(f, 11 + k, 10 - k - (i % 2), arm); put(f, 3 - k, 10 - k, arm)
    for (x, y0) in fl:
        put(f, x, (y0 + i) % 15, (255, 255, 255))
    frames.append(f)
save('xm-snowman', 'Christmas', 'Snowman', frames, 160)

GIFT = [
    "....YY..YY......",
    ".....YYYY.......",
    "..RRRRYYRRRRR...",
    "..RRRRYYRRRRR...",
    "..RRRRYYRRRRR...",
    "..YYYYYYYYYYY...",
    "..RRRRYYRRRRR...",
    "..RRRRYYRRRRR...",
    "..RRRRYYRRRRR...",
    "..RRRRYYRRRRR...",
]
frames = []
for i in range(12):
    f = blank((0, 0, 10))
    jump = 1 if i in (0, 1) else 0
    sprite(f, GIFT, {'R': (220, 0, 30), 'Y': (255, 210, 0)}, 1, 5 - jump)
    for k in range(4):
        a = (i * 30 + k * 90) * math.pi / 180
        put(f, int(7.5 + 6.5 * math.cos(a)), int(5 + 4 * math.sin(a)), (255, 255, 200) if k % 2 else (120, 200, 255))
    frames.append(f)
save('xm-gift', 'Christmas', 'Present', frames, 110)

frames = []
for i in range(8):
    f = blank((0, 0, 0))
    # cane: hook at top, staff down, stripes move
    pts = [(9, 2), (8, 1), (7, 1), (6, 1), (5, 2), (4, 3), (4, 4)] + [(9, y) for y in range(3, 15)]
    pts2 = [(10, 2), (8, 2), (7, 2), (6, 2), (5, 3), (5, 4)] + [(10, y) for y in range(3, 15)]
    for k, (x, y) in enumerate(pts):
        put(f, x, y, (230, 0, 20) if ((k + i) // 2) % 2 else (255, 255, 255))
    for k, (x, y) in enumerate(pts2):
        put(f, x, y, (230, 0, 20) if ((k + i + 1) // 2) % 2 else (255, 255, 255))
    frames.append(f)
save('xm-candycane', 'Christmas', 'Candy cane', frames, 130)

frames = []
for i in range(12):
    f = blank((0, 0, 15))
    k = 0.55 + 0.45 * math.sin(i * math.pi / 6)
    gold = scale((255, 210, 40), k)
    cx, cy = 7.5, 7.5
    for y in range(16):
        for x in range(16):
            dx, dy = x - cx, y - cy
            r = math.hypot(dx, dy)
            ang = math.atan2(dy, dx)
            lim = 3 + 4.5 * (0.5 + 0.5 * math.cos(5 * ang + math.pi / 2)) ** 2
            if r <= lim:
                put(f, x, y, gold if r > 1.6 else (255, 255, 220))
    for (x, y) in [(1, 2), (14, 3), (2, 13), (13, 13)]:
        if (i + x) % 4 == 0:
            put(f, x, y, (255, 255, 255))
    frames.append(f)
save('xm-star', 'Christmas', 'Star', frames, 100)

BELL = [
    "...YY...",
    "..YYYY..",
    ".YYYYYY.",
    ".YYYYYY.",
    ".YYYYYY.",
    "YYYYYYYY",
    "YYYYYYYY",
    "...RR...",
]
frames = []
for i, sh in enumerate([0, 1, 2, 1, 0, -1, -2, -1]):
    f = blank((10, 0, 0))
    for x in range(3, 13):
        put(f, x, 1, (0, 140, 40))
    put(f, 7, 2, (220, 0, 0)); put(f, 8, 2, (220, 0, 0))
    sprite(f, BELL, {'Y': (240, 190, 0), 'R': (160, 90, 0)}, 4 + sh, 4)
    if abs(sh) == 2:
        for d in (1, 3):
            put(f, 4 + sh + (9 if sh > 0 else -1) * 1 + (d if sh > 0 else -d), 6 + d, (255, 255, 255))
    frames.append(f)
save('xm-bell', 'Christmas', 'Bell', frames, 140)

# ---------------- Other celebrations ----------------
HEART = [
    ".RRR...RRR.",
    "RRRRR.RRRRR",
    "RRRRRRRRRRR",
    "RRRRRRRRRRR",
    ".RRRRRRRRR.",
    "..RRRRRRR..",
    "...RRRRR...",
    "....RRR....",
    ".....R.....",
]
HEART_BIG = [
    "..RRRR...RRRR..",
    ".RRRRRR.RRRRRR.",
    "RRRRRRRRRRRRRRR",
    "RRRRRRRRRRRRRRR",
    "RRRRRRRRRRRRRRR",
    ".RRRRRRRRRRRRR.",
    "..RRRRRRRRRRR..",
    "...RRRRRRRRR...",
    "....RRRRRRR....",
    ".....RRRRR.....",
    "......RRR......",
    ".......R.......",
]
frames = []
for i in range(8):
    f = blank()
    if i in (0, 2):
        sprite(f, HEART_BIG, {'R': (255, 20, 60)}, 0, 2)
    else:
        sprite(f, HEART, {'R': (220, 0, 50)}, 2, 4)
    frames.append(f)
save('ev-heart', 'Celebrations', 'Heart', frames, [120, 120, 120, 500, 120, 120, 120, 500])

frames = []
bursts = [(4, 5, (255, 60, 60), 0), (11, 4, (80, 160, 255), 6), (8, 9, (255, 220, 0), 12), (3, 11, (200, 80, 255), 17)]
for i in range(24):
    f = blank((0, 0, 6))
    for (cx, cy, c, t0) in bursts:
        t = (i - t0) % 24
        if t < 4:   # rocket going up
            put(f, cx, 15 - int((15 - cy) * t / 4), (255, 200, 120))
        elif t < 12:
            r = (t - 4) * 0.8
            k = 1 - (t - 4) / 8
            for a in range(0, 360, 45):
                put(f, int(round(cx + r * math.cos(math.radians(a)))), int(round(cy + r * math.sin(math.radians(a)))), scale(c, k))
            if t < 6:
                put(f, cx, cy, (255, 255, 255))
    frames.append(f)
save('ev-fireworks', 'Celebrations', 'Fireworks', frames, 90)

EGG = [
    "....PPPP....",
    "...PPPPPP...",
    "..PPPPPPPP..",
    "..YYYYYYYY..",
    ".PPPPPPPPPP.",
    ".GPGPGPGPGP.",
    ".PPPPPPPPPP.",
    ".YYYYYYYYYY.",
    ".PPPPPPPPPP.",
    "..PPPPPPPP..",
    "...PPPPPP...",
]
frames = []
for i, r in enumerate([0, 1, 0, -1, 0, 0, 0, 0]):
    f = blank((0, 30, 0))
    for x in range(16):
        put(f, x, 15, (40, 160, 40)); put(f, x, 14, (40, 160, 40) if x % 2 else (0, 0, 0))
    sprite(f, EGG, {'P': (255, 140, 200), 'Y': (255, 230, 60), 'G': (60, 200, 255)}, 2 + r, 3)
    frames.append(f)
save('ev-egg', 'Celebrations', 'Easter egg', frames, 150)

frames = []
conf = [(random.randint(0, 15), random.randint(0, 15), random.choice([(255, 0, 80), (0, 200, 255), (255, 220, 0), (120, 255, 0), (200, 80, 255)]), random.choice([1, 2])) for _ in range(26)]
for i in range(16):
    f = blank()
    for (x, y0, c, sp) in conf:
        y = (y0 + i * sp) % 16
        put(f, (x + (i // 4 if sp == 1 else 0)) % 16, y, c)
    frames.append(f)
save('ev-confetti', 'Celebrations', 'Confetti', frames, 90)

CLOVER = [
    "...GGG..GGG...",
    "..GGGGGGGGGG..",
    "..GGGGGGGGGG..",
    "...GGGGGGGG...",
    "GGG..GGGG..GGG",
    "GGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGG",
    ".GGGGGGGGGGGG.",
    "..GGG.GG.GGG..",
    "......GG......",
    ".......GG.....",
    "........GG....",
]
frames = []
for i in range(10):
    f = blank()
    k = 0.7 + 0.3 * math.sin(i * math.pi / 5)
    sprite(f, CLOVER, {'G': scale((20, 200, 60), k)}, 1, 2)
    if i % 5 == 0:
        put(f, 3, 3, (255, 255, 200))
    frames.append(f)
save('ev-clover', 'Celebrations', 'Lucky clover', frames, 120)


# ================= more animations (pack v2) =================
FONT = {  # 3x5 digits
    '0': ["XXX", "X.X", "X.X", "X.X", "XXX"], '1': [".X.", "XX.", ".X.", ".X.", "XXX"], '2': ["XXX", "..X", "XXX", "X..", "XXX"],
    '3': ["XXX", "..X", ".XX", "..X", "XXX"], '4': ["X.X", "X.X", "XXX", "..X", "..X"], '5': ["XXX", "X..", "XXX", "..X", "XXX"],
    '6': ["XXX", "X..", "XXX", "X.X", "XXX"], '7': ["XXX", "..X", ".X.", ".X.", ".X."], '8': ["XXX", "X.X", "XXX", "X.X", "XXX"],
    '9': ["XXX", "X.X", "XXX", "..X", "XXX"],
}

def text(f, s, x, y, c):
    for ch in s:
        sprite(f, FONT[ch], {'X': c}, x, y)
        x += 4

# ---- Halloween ----
CAT = [
    ".K.....K.",
    ".KK...KK.",
    ".KKKKKKK.",
    "KKEKKKEKK",
    "KKKKKKKKK",
    ".KKKPKKK.",
    "..KKKKK..",
    ".KKKKKKK.",
    "KKKKKKKKK",
    "KKKKKKKKK",
    "KKKKKKKKK",
    ".KK...KK.",
]
frames = []
for i in range(16):
    f = blank((10, 0, 25))
    for (x, y) in [(13, 1), (14, 1), (13, 2), (14, 2), (12, 2)]:
        put(f, x, y, (250, 240, 170))
    blink = i in (5, 6)
    sprite(f, CAT, {'K': (70, 60, 95), 'E': (70, 60, 95) if blink else (255, 220, 0), 'P': (255, 120, 160)}, 2, 3)
    tail = [(11, 13), (12, 12), (13, 11), (13, 10)] if (i // 4) % 2 == 0 else [(11, 13), (12, 13), (13, 12), (14, 11)]
    for (x, y) in tail:
        put(f, x, y, (70, 60, 95))
    for x in range(16):
        put(f, x, 15, (60, 30, 80))
    frames.append(f)
save('hw-cat', 'Halloween', 'Black cat', frames, 120)

GRAVE = [
    "..GGGG..",
    ".GGGGGG.",
    "GGGGGGGG",
    "GGDGGDGG",
    "GDDDDDDG",
    "GGDGGDGG",
    "GGGGGGGG",
    "GGGGGGGG",
]
frames = []
for i in range(16):
    f = blank((0, 0, 15))
    sprite(f, GRAVE, {'G': (120, 120, 130), 'D': (70, 70, 80)}, 4, 5)
    for x in range(16):
        put(f, x, 13, (30, 60, 20)); put(f, x, 14, (30, 60, 20)); put(f, x, 15, (40, 25, 10))
    for x in range(16):   # drifting fog
        k = 0.5 + 0.5 * math.sin((x + i) * 0.7)
        put(f, x, 12, mix(f[12][x], (140, 140, 170), 0.6 * k))
        if (x + i) % 5 == 0:
            put(f, x, 11, mix(f[11][x], (110, 110, 140), 0.5))
    if i in (3, 4, 11):
        put(f, 1, 2, (200, 255, 200)); put(f, 14, 4, (200, 255, 200))
    frames.append(f)
save('hw-grave', 'Halloween', 'Graveyard', frames, 140)

frames = []
HAND = ["G.G.G", "G.G.G", "GGGGG", "GGGGG", ".GGG.", ".GGG.", ".GGG."]
for i in range(16):
    f = blank((5, 0, 15))
    rise = min(7, i) if i < 12 else 7 - (i - 11) * 2
    sprite(f, HAND, {'G': (110, 170, 90)}, 6, 15 - max(0, rise) - 1)
    if i >= 7 and i < 12 and i % 2:   # wave
        put(f, 5, 15 - rise, (110, 170, 90))
    for x in range(16):
        put(f, x, 14, (60, 40, 20)); put(f, x, 15, (45, 30, 15))
    for (x, y) in [(3, 13), (11, 13), (12, 12)]:
        put(f, x, y, (60, 40, 20))
    frames.append(f)
save('hw-hand', 'Halloween', 'Zombie hand', frames, 140)

CORN = [
    "......WW......",
    ".....WWWW.....",
    "....OOOOOO....",
    "...OOOOOOOO...",
    "..YYYYYYYYYY..",
    ".YYYYYYYYYYYY.",
]
frames = []
for i in range(8):
    f = blank((20, 0, 30))
    for k, dy in enumerate([0, 1, 0, -1]):
        pass
    bob = [0, 1, 1, 0, 0, -1, -1, 0][i]
    sprite(f, CORN, {'W': (255, 255, 235), 'O': (255, 120, 0), 'Y': (255, 210, 0)}, 1, 5 + bob)
    for k in range(5):
        a = (i * 45 + k * 72) * math.pi / 180
        put(f, int(7.5 + 7 * math.cos(a)), int(8 + 6 * math.sin(a)), (255, 150, 0) if k % 2 else (180, 0, 255))
    frames.append(f)
save('hw-candycorn', 'Halloween', 'Candy corn', frames, 120)

HAT = [
    "......KK........",
    ".....KKK........",
    "....KKKK........",
    "....KKKKK.......",
    "...KKKKKK.......",
    "...KKKKKKK......",
    "..KPPPPPPPK.....",
    "..KKKKKKKKK.....",
    "KKKKKKKKKKKKK...",
]
frames = []
for i in range(12):
    f = blank((15, 0, 30))
    for k in range(6):
        sx, sy = (k * 5 + 3) % 16, (k * 7 + 1) % 6
        if (i + k) % 4:
            put(f, sx, sy, (200, 200, 255))
    sprite(f, HAT, {'K': (95, 50, 140), 'P': scale((160, 0, 255), 0.6 + 0.4 * (i % 2))}, 2, 6)
    b = (i % 6)
    for x in range(16):
        put(f, x, 15, (70, 35, 0))
    put(f, 13 - b, 13, (255, 230, 120))   # sparkles from the hat
    put(f, 14 - b // 2, 12 - b // 3, (255, 160, 255))
    frames.append(f)
save('hw-witchhat', 'Halloween', 'Witch hat', frames, 130)

frames = []
for i in range(16):
    f = blank((0, 0, 20))
    for y in range(16):
        for x in range(16):
            if math.hypot(x - 8, y - 7) <= 5.5:
                put(f, x, y, (240, 235, 190))
            if math.hypot(x - 6, y - 6) < 1.2 or math.hypot(x - 10, y - 9) < 1.1:
                put(f, x, y, (200, 195, 150))
    cx = (i * 1.2) % 26 - 6
    for dx in range(7):
        for dy in range(2):
            x = int(cx + dx)
            put(f, x, 9 + dy, mix(f[9 + dy][x % 16] if 0 <= x < 16 else (0, 0, 0), (70, 70, 100), 0.85))
    frames.append(f)
save('hw-moon', 'Halloween', 'Full moon', frames, 120)

# ---- Christmas ----
frames = []
for i, sh in enumerate([0, 1, 1, 0, 0, -1, -1, 0]):
    f = blank((0, 0, 10))
    for y in range(0, 4):
        put(f, 8, y, (180, 180, 180))
    put(f, 7, 4, (220, 200, 60)); put(f, 8, 4, (220, 200, 60))
    cx, cy = 7.5 + sh, 9.5
    for y in range(16):
        for x in range(16):
            r = math.hypot(x - cx, y - cy)
            if r <= 5:
                c = (220, 0, 40)
                if abs(y - cy) < 1: c = (255, 210, 0)
                if r < 2.2 and x < cx and y < cy: c = (255, 140, 150)
                put(f, x, y, c)
    if i % 4 == 0:
        put(f, int(cx - 2), int(cy - 3), (255, 255, 255))
    frames.append(f)
save('xm-ornament', 'Christmas', 'Ornament', frames, 160)

GINGER = [
    "....BBBB....",
    "...BBBBBB...",
    "...BWBBWB...",
    "...BBBBBB...",
    "....BRRB....",
    ".BBBBBBBBBB.",
    "BBBBBWBBBBBB",
    "BB.BBBBBB.BB",
    "...BBWBBB...",
    "...BBBBBB...",
    "..BBB..BBB..",
    "..BB....BB..",
    ".BBB....BBB.",
]
frames = []
for i in range(8):
    f = blank((15, 0, 0))
    hop = 1 if i % 4 in (1, 2) else 0
    sprite(f, GINGER, {'B': (170, 90, 30), 'W': (255, 255, 255), 'R': (230, 0, 30)}, 2, 2 - hop)
    for x in range(16):
        put(f, x, 15, (255, 255, 255) if (x + i) % 2 else (230, 0, 30))
    frames.append(f)
save('xm-gingerbread', 'Christmas', 'Gingerbread', frames, 150)

HOLLY = [
    "..GG......GG..",
    ".GGGG....GGGG.",
    "GGGGGG..GGGGGG",
    ".GGGGGRRGGGGG.",
    "..GGGRRRRGGG..",
    "...GG.RR.GG...",
]
frames = []
for i in range(10):
    f = blank((0, 0, 0))
    k = 0.7 + 0.3 * math.sin(i * math.pi / 5)
    sprite(f, HOLLY, {'G': (0, 140, 40), 'R': scale((255, 0, 20), k)}, 1, 5)
    if i % 5 == 0:
        put(f, 7, 8, (255, 220, 220))
    for x in range(16):
        if (x + i) % 4 == 0:
            put(f, x, 1, (255, 215, 0)); put(f, (x + 2) % 16, 14, (255, 215, 0))
    frames.append(f)
save('xm-holly', 'Christmas', 'Holly', frames, 140)

frames = []
pts = [(int(round(7.5 + 6 * math.cos(a * math.pi / 12))), int(round(7.5 + 6 * math.sin(a * math.pi / 12)))) for a in range(24)]
for i in range(12):
    f = blank((0, 0, 0))
    for k, (x, y) in enumerate(pts):
        put(f, x, y, (0, 130, 30))
        for (dx, dy) in [(1, 0), (0, 1)]:
            put(f, x + dx, y + dy, (0, 100, 20))
    for k in range(0, 24, 3):
        x, y = pts[k]
        put(f, x, y, LC[(k // 3 + i) % 5] if (k // 3 + i) % 2 else (0, 130, 30))
    for (x, y, c) in [(6, 13, (220, 0, 0)), (7, 13, (220, 0, 0)), (8, 13, (220, 0, 0)), (9, 13, (220, 0, 0)), (6, 14, (220, 0, 0)), (9, 14, (220, 0, 0))]:
        put(f, x, y, c)
    frames.append(f)
save('xm-wreath', 'Christmas', 'Wreath', frames, 180)

SOCK = [
    "WWWWWW...",
    "WWWWWW...",
    "RRRRRR...",
    "RRGRRR...",
    "RRRRRR...",
    "RRRGRR...",
    "RRRRRR...",
    "RRRRRRRR.",
    "RRRRRRRRR",
    ".RRRRRRRR",
    "..RRRRRR.",
]
frames = []
for i, sw in enumerate([0, 0, 1, 1, 0, 0, -1, -1]):
    f = blank((30, 10, 0))
    for x in range(16):
        put(f, x, 2, (110, 60, 20))
    sprite(f, SOCK, {'W': (240, 240, 240), 'R': (210, 0, 30), 'G': (0, 160, 40)}, 4 + sw, 3)
    if i % 4 == 0:
        put(f, 5 + sw, 2, (255, 230, 0))
    for x in range(3, 13):
        put(f, x, 15, (255, 100 + 50 * ((x + i) % 3), 0))
    frames.append(f)
save('xm-stocking', 'Christmas', 'Stocking', frames, 150)

# ---- Celebrations ----
CAKE = [
    "................",
    "................",
    "................",
    "..PPPPPPPPPPPP..",
    "..WPWPWPWPWPWP..",
    "..PPPPPPPPPPPP..",
    "..YYYYYYYYYYYY..",
    ".BBBBBBBBBBBBBB.",
    ".BWBWBWBWBWBWBW.",
    ".BBBBBBBBBBBBBB.",
    ".BBBBBBBBBBBBBB.",
    "GGGGGGGGGGGGGGGG",
]
frames = []
for i in range(10):
    f = blank()
    sprite(f, CAKE, {'P': (255, 120, 180), 'W': (255, 255, 255), 'Y': (255, 220, 0), 'B': (130, 60, 30), 'G': (150, 150, 160)}, 0, 4)
    for k, x in enumerate([4, 7, 10]):
        for y in (4, 5, 6):
            put(f, x, y, (100, 180, 255))
        fl = (255, 220, 60) if (i + k) % 3 else (255, 120, 0)
        put(f, x, 3, fl); put(f, x, 2, scale(fl, 0.5) if (i + k) % 2 else (0, 0, 0))
    frames.append(f)
save('ev-cake', 'Celebrations', 'Birthday cake', frames, 120)

frames = []
bal = [(2, (255, 0, 60), 0), (7, (0, 160, 255), 5), (12, (255, 210, 0), 10), (5, (160, 60, 255), 13)]
for i in range(16):
    f = blank((0, 0, 10))
    for (x, c, t0) in bal:
        y = 16 - ((i + t0) % 16) * 1.4
        yy = int(y)
        for (dx, dy) in [(0, 0), (1, 0), (-1, 1), (0, 1), (1, 1), (2, 1), (-1, 2), (0, 2), (1, 2), (2, 2), (0, 3), (1, 3)]:
            put(f, x + dx, yy + dy, c)
        put(f, x, yy + 1, scale(c, 1.4) if True else c)
        for k in range(4, 7):
            put(f, x + (k % 2), yy + k, (200, 200, 200))
    frames.append(f)
save('ev-balloons', 'Celebrations', 'Balloons', frames, 110)

frames = []
for i in range(20):
    f = blank((0, 0, 10))
    c = [(255, 210, 0), (255, 255, 255), (0, 200, 255), (255, 60, 160)][(i // 5) % 4]
    text(f, '2027', 0, 5, c)
    for k in range(6):
        if (i + k * 3) % 5 == 0:
            put(f, (k * 5 + i) % 16, (k * 3) % 4, (255, 255, 255))
            put(f, (k * 7 + i) % 16, 12 + (k % 4), (255, 200, 0))
    frames.append(f)
save('ev-newyear', 'Celebrations', 'New Year 2027', frames, 120)

frames = []
hearts = [(2, 0, (255, 30, 90)), (9, 6, (255, 100, 160)), (5, 11, (220, 0, 60)), (12, 3, (255, 60, 120))]
SMALLH = ["X.X", "XXX", ".X."]
for i in range(16):
    f = blank((20, 0, 10))
    for (x, t0, c) in hearts:
        y = 15 - ((i + t0) % 16)
        xx = x + (1 if ((i + t0) // 3) % 2 else 0)
        sprite(f, SMALLH, {'X': c}, xx, y)
    frames.append(f)
save('ev-hearts', 'Celebrations', 'Floating hearts', frames, 110)

BUNNY = [
    "..W...W...",
    "..WP..WP..",
    "..WP..WP..",
    "..WW..WW..",
    ".WWWWWWW..",
    "WWKWWWKWW.",
    "WWWWPWWWW.",
    ".WWWWWWW..",
    "..WWWWWW..",
    ".WWWWWWWW.",
    ".WWWWWWWWW",
    "..WW..WW..",
]
frames = []
for i in range(8):
    f = blank((40, 120, 255))
    hop = [0, 1, 2, 2, 1, 0, 0, 0][i]
    for x in range(16):
        put(f, x, 15, (40, 170, 40)); put(f, x, 14, (40, 170, 40) if x % 3 else (255, 220, 0))
    sprite(f, BUNNY, {'W': (245, 245, 245), 'P': (255, 150, 180), 'K': (20, 20, 20)}, 3, 2 - hop)
    frames.append(f)
save('ev-bunny', 'Celebrations', 'Bunny', frames, 130)

frames = []
RB = [(255, 0, 0), (255, 120, 0), (255, 220, 0), (0, 200, 40), (0, 120, 255), (130, 40, 220)]
for i in range(12):
    f = blank((90, 170, 255))
    for k, c in enumerate(RB):
        r = 8 - k
        for a in range(0, 181, 6):
            x = int(round(7.5 + r * math.cos(math.radians(a))))
            y = int(round(13 - r * math.sin(math.radians(a))))
            put(f, x, y, c)
    for (x, y) in [(0, 12), (1, 12), (1, 11), (2, 12), (14, 12), (15, 12), (14, 11), (13, 12)]:
        put(f, x, y, (255, 255, 255))
    if i % 3 == 0:
        put(f, 7 + (i % 5) - 2, 7, (255, 255, 255))
    frames.append(f)
save('ev-rainbow', 'Celebrations', 'Rainbow', frames, 140)

frames = []
for i in range(12):
    f = blank((40, 140, 255))
    for y in range(16):
        for x in range(16):
            d = math.hypot(x - 7.5, y - 7.5)
            if d <= 3.6:
                put(f, x, y, (255, 230, 40))
            else:
                a = math.atan2(y - 7.5, x - 7.5) + i * math.pi / 24
                if d <= 7 and (math.cos(8 * a) > 0.55):
                    put(f, x, y, (255, 170, 0))
    put(f, 6, 7, (60, 40, 0)); put(f, 9, 7, (60, 40, 0))
    for x in (6, 7, 8, 9):
        put(f, x, 9 if x in (7, 8) else 8, (60, 40, 0))
    frames.append(f)
save('ev-sun', 'Celebrations', 'Sun', frames, 110)

with open(os.path.join(OUT, 'pack.json'), 'w') as fp:
    json.dump(PACK, fp, separators=(',', ':'))
print(len(PACK), 'gifs')
