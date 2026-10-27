#!/usr/bin/env python3
# LED4YOU "a sua mensagem na matriz": ponte entre a página dos visitantes e uma matriz LED4YOU / WLED em casa.
#
# A página pública (show/index.html) envia cada pedido para um canal do ntfy.sh. Este programa corre num
# computador da rede de casa (por exemplo o Raspberry Pi do FPP), ouve esse canal e mostra os pedidos na matriz,
# um de cada vez, através da interface JSON do WLED. A rede de casa nunca fica aberta para a internet.
#
# Só usa a biblioteca normal do Python 3 (nada para instalar). Arranque:  python3 ponte_show.py
# Teste sem internet nem página:            python3 ponte_show.py --teste "Feliz Halloween!"

import json, sys, time, threading, queue, unicodedata, re, urllib.request, uuid

# ------------------------------------------------------------------ definições (mude aqui) -----
TOPIC = "l4yshow-3352b4beefd1"     # o código do show (o mesmo que vai no QR: ...?t=<isto>)
WLED = "192.168.1.50"              # IP da placa LED4YOU / WLED da matriz
ZONE = 0                            # zona (segmento) da matriz onde aparecem os pedidos
W, H = 16, 16                       # tamanho da matriz (igual ao do QR: &w=..&h=..)
SECONDS = {"text": 20, "gif": 12, "draw": 15}   # quanto tempo fica cada pedido
QUEUE_MAX = 20                      # pedidos em espera, no máximo (os seguintes são ignorados)
GIF_SITE = "https://coristinaa.github.io/led4you/gifs/"   # de onde vêm as imagens (o GIF pack do LED4YOU)
RELAY = "https://ntfy.sh/"
# -------------------------------------------------------------------------------------------------

PAL = ["000000", "ffffff", "ff2a2a", "ff7a1a", "ffd23f", "39d353", "2bb7ff", "9b5cff", "ff4fd8"]   # igual à página
BAD = ["merda", "caralho", "foda", "fodase", "puta", "cabrao", "cona", "piroca", "pila", "paneleiro", "filhodaputa",
       "corno", "cu", "mamas", "boceta", "porra", "fuck", "shit", "bitch", "dick", "pussy", "cunt", "nigger", "nazi", "hitler"]
FX_TEXT, FX_IMAGE = 122, 53          # efeitos do WLED: texto a passar, imagem (GIF)
GIF_OK = re.compile(r"^(hw|xm|ev)-[a-z0-9]{2,20}\.gif$")

jobs = queue.Queue(QUEUE_MAX)
uploaded = set()


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def plain(s):
    """sem acentos (as letras do WLED são só as básicas)"""
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()


def is_bad(s):
    n = plain(s).lower()
    n = n.translate(str.maketrans("0@1!345$", "ooiieass"))
    words = re.split(r"[^a-z]+", n)
    joined = re.sub(r"[^a-z]", "", n)
    return any(b in words or (len(b) >= 5 and b in joined) for b in BAD)


def wled(path, body=None, timeout=5):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request("http://%s%s" % (WLED, path), data=data, headers={"Content-Type": "application/json"} if data else {})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read() or b"null")


def upload_gif(name):
    """a primeira vez que uma imagem é pedida, vai buscá-la ao site e põe-na na placa"""
    if name in uploaded:
        return True
    try:
        with urllib.request.urlopen(GIF_SITE + name, timeout=10) as r:
            gif = r.read()
        b = uuid.uuid4().hex
        body = (("--%s\r\nContent-Disposition: form-data; name=\"data\"; filename=\"/%s\"\r\nContent-Type: image/gif\r\n\r\n" % (b, name)).encode()
                + gif + ("\r\n--%s--\r\n" % b).encode())
        req = urllib.request.Request("http://%s/upload" % WLED, data=body, headers={"Content-Type": "multipart/form-data; boundary=" + b})
        with urllib.request.urlopen(req, timeout=15) as r:
            r.read()
        uploaded.add(name)
        return True
    except Exception as e:
        log("imagem", name, "não foi para a placa:", e)
        return False


def check(msg):
    """valida um pedido vindo da internet; devolve (tipo, comando para o WLED) ou None"""
    try:
        m = json.loads(msg)
    except Exception:
        return None
    if not isinstance(m, dict):
        return None
    k = m.get("k")
    if k == "text":
        t = str(m.get("t", ""))[:40].strip()
        if not t or is_bad(t):
            return None
        t = re.sub(r"[^ -~]", "", plain(t)).strip()   # só letras simples (ASCII)
        if not t:
            return None
        c = m.get("c", 3)
        c = PAL[c] if isinstance(c, int) and 1 <= c < len(PAL) else PAL[3]
        rgb = [int(c[i:i + 2], 16) for i in (0, 2, 4)]
        return "text", {"on": True, "seg": {"id": ZONE, "fx": FX_TEXT, "n": t, "col": [rgb, [0, 0, 0], rgb], "sx": 140, "ix": 128,
                                           "c1": 0, "c2": 128, "c3": 16, "o1": False, "o2": False, "o3": False, "tp": False, "frz": False}}
    if k == "gif":
        f = str(m.get("f", ""))
        if not GIF_OK.match(f):
            return None
        return "gif", {"on": True, "seg": {"id": ZONE, "fx": FX_IMAGE, "n": f, "sx": 128, "ix": 0, "c3": 0, "frz": False}}
    if k == "draw":
        p = str(m.get("p", ""))
        w, h = m.get("w"), m.get("h")
        if w != W or h != H or len(p) != W * H or not re.fullmatch(r"[0-8]+", p):
            return None
        pix = [0, W * H, "000000"]
        for i, ch in enumerate(p):
            if ch != "0":
                pix += [i, PAL[int(ch)]]
        return "draw", {"on": True, "seg": {"id": ZONE, "frz": True, "i": pix}}
    return None


def show_loop():
    saved = None
    while True:
        try:
            kind, cmd, raw = jobs.get(timeout=1)
        except queue.Empty:
            if saved is not None:   # nada mais em fila: volta ao que estava antes
                try:
                    for s in saved.get("seg", []):
                        s["frz"] = False
                    wled("/json/state", saved)
                    log("de volta ao que estava")
                except Exception as e:
                    log("não voltei ao estado anterior:", e)
                saved = None
            continue
        try:
            if saved is None:
                saved = wled("/json/state")   # o que a matriz mostrava antes dos pedidos
            if kind == "gif" and not upload_gif(cmd["seg"]["n"]):
                continue
            wled("/json/state", cmd)
            log("a mostrar", kind, raw[:60])
            time.sleep(SECONDS[kind])
        except Exception as e:
            log("a placa não respondeu:", e)
            time.sleep(3)


def listen():
    since = None   # só os pedidos novos; depois de uma falha, continua a partir do último recebido
    while True:
        try:
            url = "%s%s/json" % (RELAY, TOPIC) + ("?since=%s" % since if since else "")
            with urllib.request.urlopen(url, timeout=90) as r:
                log("ligado ao canal", TOPIC)
                for line in r:
                    ev = json.loads(line)
                    if ev.get("event") != "message":
                        continue
                    since = ev.get("id", since)
                    add(ev.get("message", ""))
        except Exception as e:
            log("canal desligado (", e, ") — volto a ligar daqui a 5 s")
            time.sleep(5)


def add(msg):
    job = check(msg)
    if not job:
        log("pedido recusado:", msg[:80])
        return
    try:
        jobs.put_nowait((job[0], job[1], msg))
        log("pedido em fila:", job[0], "(%d à espera)" % jobs.qsize())
    except queue.Full:
        log("fila cheia, pedido ignorado")


if __name__ == "__main__":
    threading.Thread(target=show_loop, daemon=True).start()
    if len(sys.argv) > 2 and sys.argv[1] == "--teste":
        add(json.dumps({"k": "text", "t": sys.argv[2], "c": 3}))
        time.sleep(SECONDS["text"] + 3)
    else:
        listen()
