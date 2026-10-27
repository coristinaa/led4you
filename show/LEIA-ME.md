# A sua mensagem na matriz (LED4YOU) — v2

Os visitantes leem um código QR e, no telemóvel, escrevem um texto, escolhem uma imagem animada ou fazem um desenho.
O pedido aparece numa matriz LED4YOU / WLED, um de cada vez, por ordem de chegada.

```
telemóvel do visitante ──► página pública ──► ntfy.sh (canal do show) ──► ponte_show.py (em casa) ──► matriz
```

A rede de casa nunca fica aberta para a internet: é a ponte, em casa, que vai buscar os pedidos.

## 1. Instalar a ponte (uma vez)

Corre em qualquer computador da rede de casa com Python 3 — o Raspberry Pi do FPP serve. Não precisa de instalar nada.

1. Copie `ponte_show.py` para o Pi (por exemplo para `/home/fpp/`).
2. Arranque: `python3 ponte_show.py`
3. No telemóvel ou no computador, **na rede de casa**, abra a página de controlo: **http://IP-DO-PI:8099**

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

## 2. Página de controlo (http://IP-DO-PI:8099)

- **Mostrar os pedidos dos visitantes**: liga e desliga a opção a qualquer altura. Desligada, a página dos visitantes
  diz "A matriz não está a receber pedidos neste momento" e não deixa enviar.
- **Procurar placas na rede** → escolha a **placa** e a **zona** onde aparecem os pedidos. O tamanho da grelha de desenho
  vem da zona escolhida.
- **Tema**: Halloween, Natal, outras festas ou todas (imagens e mensagens rápidas da página dos visitantes).
- **Tempo** de cada texto, imagem e desenho na matriz.
- **Aprovar cada pedido antes de aparecer**: os pedidos ficam em "Por aprovar", com o texto, a imagem ou o desenho,
  e os botões Mostrar / Recusar.
- **Código QR para o cartaz**: o endereço já com o tamanho e o tema certos, para copiar.
- **Testar**: escreve um texto que passa logo na matriz.
- **Registo**: o que a ponte está a fazer.

Carregue em **Guardar** depois de mudar a placa, a zona, o tema ou os tempos. As escolhas ficam em `show_config.json`.

**Atenção:** se mudar a zona (tamanho) ou o tema, o endereço do QR muda: imprima o cartaz com o endereço novo.

## Como funciona

- **Texto**: até 40 letras, efeito de texto a passar do WLED. Os acentos são tirados (as letras do WLED são só as básicas).
- **Imagem**: GIF do LED4YOU GIF pack. Na primeira vez, a ponte vai buscá-lo ao site e envia-o para a placa.
- **Desenho**: 9 cores, do tamanho da zona.
- Quando não há mais pedidos em fila, a matriz volta ao que mostrava antes.

## Cuidados

- **Palavrões**: a página e a ponte recusam uma lista de palavras (português e inglês), também escritas com números
  (f0da, m3rda…). Nenhum filtro é perfeito: para texto livre, a aprovação é o mais seguro.
- **Um pedido por minuto** em cada telemóvel; no máximo 20 pedidos em fila ou por aprovar.
- O canal do ntfy.sh é público: quem souber o código do show pode enviar pedidos. A ponte só aceita os três tipos de
  pedido, com tamanhos e imagens válidos. Para mudar o código, mude `topic` em `show_config.json` e reimprima o QR.
- A página de controlo não tem palavra-passe: só é acessível na rede de casa.
- **Durante o show do FPP**: se a matriz recebe as sequências do xLights, o FPP manda nela e os pedidos são tapados.
  Use uma matriz fora das sequências, ou um intervalo na playlist em que a matriz fica livre.
