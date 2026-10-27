# A sua mensagem na matriz (LED4YOU)

Os visitantes leem um código QR e, no telemóvel, escrevem um texto, escolhem uma imagem animada ou fazem um desenho.
O pedido aparece numa matriz LED4YOU / WLED, um de cada vez, por ordem de chegada.

```
telemóvel do visitante ──► página pública ──► ntfy.sh (canal do show) ──► ponte_show.py (em casa) ──► matriz
```

A rede de casa nunca fica aberta para a internet: é a ponte, em casa, que vai buscar os pedidos.

## 1. Endereço do QR

```
https://coristinaa.github.io/led4you/show/?t=l4yshow-3352b4beefd1&w=16&h=16&tema=hw
```

- `t` = código do show (tem de ser igual ao `TOPIC` da ponte)
- `w`, `h` = tamanho da matriz (a grelha de desenho fica com este tamanho)
- `tema` = `hw` (Halloween), `xm` (Natal), `ev` (outras festas) ou nada (todas as imagens). Também muda as mensagens rápidas.

## 2. A ponte (ponte_show.py)

Corre em qualquer computador da rede de casa com Python 3: o Raspberry Pi do FPP serve. Não precisa de instalar nada.

1. Copie `ponte_show.py` para o Pi (por exemplo para `/home/fpp/`).
2. Abra o ficheiro e mude as definições no início:
   - `WLED` = IP da placa da matriz
   - `ZONE` = zona da matriz (0 se for a única)
   - `W`, `H` = tamanho da matriz (igual ao QR)
   - `SECONDS` = quanto tempo fica cada pedido
3. Teste sem a página: `python3 ponte_show.py --teste "Ola"` — o texto deve passar na matriz e, no fim, ela volta ao que estava.
4. Arranque normal: `python3 ponte_show.py`

Para arrancar sozinha com o Pi, crie `/etc/systemd/system/ponte-show.service`:

```
[Unit]
Description=LED4YOU ponte do show
After=network-online.target

[Service]
ExecStart=/usr/bin/python3 /home/fpp/ponte_show.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

e depois `sudo systemctl enable --now ponte-show`.

## Como funciona

- **Texto**: até 40 letras, efeito de texto a passar do WLED. Os acentos são tirados (as letras do WLED são só as básicas).
- **Imagem**: GIF do LED4YOU GIF pack. Na primeira vez, a ponte vai buscá-lo ao site e envia-o para a placa.
- **Desenho**: 9 cores, do tamanho da matriz.
- Quando não há mais pedidos em fila, a matriz volta ao que mostrava antes.

## Cuidados

- **Palavrões**: a página e a ponte recusam uma lista de palavras (português e inglês), também escritas com números (f0da, m3rda…). Nenhum filtro é perfeito.
- **Um pedido por minuto** em cada telemóvel; no máximo 20 pedidos em fila (os seguintes são ignorados).
- O canal do ntfy.sh é público: quem souber o código do show pode enviar pedidos. A ponte só aceita os três tipos de pedido, com tamanhos e imagens válidos. Para mudar o código, troque `TOPIC` na ponte e o `t=` no QR.
- **Durante o show do FPP**: se a matriz recebe as sequências do xLights, o FPP manda nela e os pedidos são tapados. Use uma matriz fora das sequências, ou um intervalo na playlist em que a matriz fica livre.
