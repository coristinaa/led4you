# LED4YOU v1

Firmware LED4YOU, baseado no WLED 16.0.1 (versão estável).

## O que mudou em relação ao WLED

- **Nome**: LED4YOU em toda a interface, no título das páginas, no ponto de acesso Wi-Fi (`LED4YOU-AP`), no nome do dispositivo e no endereço de rede (`led4you-xxxxxx.local`).
- **Visual novo**: tema escuro "neon" (fundo índigo, destaques magenta, violeta e ciano), barra de marca no topo com o logótipo LED4YOU, sliders e seleções com brilho de cor, botões mais modernos. O tema claro também foi redesenhado (botão do sol ao lado do brilho alterna entre os dois). As páginas de configuração têm o mesmo estilo.
- **Todas as funções mantidas**: efeitos, paletas, segmentos, presets, playlists, Pixel Art Converter, PixelMagic, PixelForge, editor de paletas, editor de ficheiros, live view, matriz 2D, sincronização, E1.31/DDP/Art-Net (xLights), MQTT, Home Assistant, Alexa, etc.
- **Compatibilidade mantida**: a API JSON e o serviço mDNS `_wled._tcp` não foram alterados, por isso a app WLED, o Home Assistant e o xLights continuam a encontrar e controlar o dispositivo.
- **Removido de propósito**:
  - o botão "Auto update" da página de atualização (instalaria o WLED oficial por cima do LED4YOU);
  - o aviso de nova versão que envia estatísticas de uso para os servidores do projeto WLED.

Senha do ponto de acesso continua a ser `wled1234` (pode ser mudada em `wled00/const.h`, `DEFAULT_AP_PASS`).

## Bluetooth (v5)

O alvo `led4you_c3` (ESP32-C3) inclui Bluetooth Low Energy e o modo áudio-reativo (microfone); o controlo por infravermelhos foi retirado para libertar espaço.

- **Configurar o Wi-Fi por Bluetooth:** padrão Improv Wi-Fi. Em Chrome ou Edge (Android, Windows, Mac), abrir https://www.improv-wifi.com , secção "Improv via BLE", e escolher o dispositivo `LED4YOU-xxxx`. O Home Assistant também o deteta.
- **Controlo por Bluetooth:** serviço próprio que aceita o mesmo JSON de `/json/state` (detalhes em `usermods/led4you_ble/readme.md`).
- Pode ser desligado em *Config → Usermods → LED4YOU Bluetooth* (efeito após reiniciar).

## Novidades v13 (app v7)

Tudo funciona por Bluetooth (app) e por Wi-Fi (página Studio, separador More):

- **Modo desenho** no My LEDs: ferramentas Select / Draw / Erase. Arrasta o dedo sobre os LEDs para pintar; as luzes acompanham ao vivo. Pincel 1×1, 2×2 ou 3×3 em matrizes. "Send to lights" grava o desenho (com os modos de piscar, respirar, etc.).
- **Sleep timer:** desliga suavemente após 15 min a 4 h.
- **Schedule:** ligar a uma hora ou ao pôr do sol (com preset à escolha), desligar a uma hora ou ao nascer do sol, por dias da semana. "Use my location" envia a localização do telemóvel para calcular o pôr do sol. A placa recebe a hora do telemóvel, por isso funciona sem internet.
- **Seasons:** temas de Halloween (Pumpkin glow, Haunted, Spooky eyes, Storm, Witch brew) e de Natal (Retro tree, Candy cane, Snowfall, Merry twinkle, Fireplace). Quatro efeitos novos do LED4YOU: Candy Cane, Snowfall, Haunted e Retro Tree.
- **Countdown:** contagem decrescente em texto numa matriz (ex.: "XMAS 12d 5h").
- **Preset loop:** mostra os presets guardados em sequência.
- **Sound:** efeitos com música e configuração do microfone (I2S INMP441 ou PDM).
- **Motion scare:** sensor de movimento PIR toca um preset durante X segundos e depois volta ao que estava.
- **Light group:** várias placas LED4YOU no mesmo Wi-Fi mudam em conjunto (Lead / Follow).
- **Power:** consumo estimado face ao limite configurado.
- **Presets com nome:** guardar com nome, apagar, e o nome aparece na app.

## Novidades v15 (app v10): a casa toda

- **House scenes** (app → More, e Studio → More): um toque muda todas as placas LED4YOU no Wi-Fi. Cada placa toca o **seu** preset com o mesmo número (ex.: preset 1 = Halloween em todas, mas a janela mostra a abóbora, o telhado faz laranja/roxo, as árvores verde). "All off" desliga tudo. Pelo Bluetooth, a placa a que estás ligado reenvia a cena às outras pelo Wi-Fi.
- **Schedule → Whole house:** o horário liga/desliga a casa inteira.
- **Studio → House (só Wi-Fi):** lista de todas as placas da rede, mudar nomes, ver que presets (1-10) cada uma tem, e preparar o **xLights** (tabela com IP e canais DDP de cada placa, e opção "xLights can control this light").
- Várias casas LED4YOU perto (vizinhos)? Em House settings escolhe um número de casa diferente.

## Como compilar

1. Instalar o **VS Code** e a extensão **PlatformIO IDE**.
2. Abrir esta pasta no VS Code.
3. Na barra do PlatformIO (ícone da formiga), em *Project Tasks*, escolher a placa e clicar em **Build**:
   - `esp32dev` — ESP32 normal (4 MB)
   - `led4you_c3` — ESP32-C3 com Bluetooth e microfone (recomendado)
   - `esp32c3dev` — ESP32-C3 sem Bluetooth
   - `esp32s3dev_8MB_qspi` — ESP32-S3
   - `nodemcuv2` — ESP8266 (NodeMCU, Wemos D1 mini)
4. O ficheiro fica em `build_output/release/` (ex.: `LED4YOU_..._ESP32.bin`).
5. Gravar com **Upload** (placa ligada por USB) ou, num dispositivo que já tenha WLED, em *Config → Security & Updates → Manual upload*.

Se alterares a interface (`wled00/data/`), corre `npm install` e `npm run build` antes de compilar (o PlatformIO também o faz automaticamente).

## Licença

O WLED é distribuído sob a licença **EUPL v1.2** (ficheiro `LICENSE`). Para uso pessoal podes fazer o que quiseres. Se venderes ou distribuíres dispositivos com o LED4YOU, tens de disponibilizar o código-fonte com as tuas alterações sob a mesma licença e manter os créditos ao WLED (já incluídos na página *Config → Security & Updates → About* e no painel *Info*).
