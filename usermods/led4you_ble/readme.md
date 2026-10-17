# LED4YOU Bluetooth (BLE)

Adds Bluetooth Low Energy to LED4YOU (ESP32 family, tested target ESP32-C3).

1. **Wi-Fi setup over Bluetooth** using the open [Improv Wi-Fi BLE](https://www.improv-wifi.com/ble/) standard.
   Works with the Improv page at improv-wifi.com (Chrome/Edge on Android, Windows, macOS, Linux) and with Home Assistant.
2. **Simple control over Bluetooth**: a custom GATT service that accepts the same JSON as `/json/state`
   (e.g. `{"on":true,"bri":128,"fx":9}`) and notifies a compact state summary.

| Item | UUID |
|---|---|
| Control service | `c0de4c45-4434-594f-55aa-000000000000` |
| Command (write) | `c0de4c45-4434-594f-55aa-000000000001` |
| State (read/notify) | `c0de4c45-4434-594f-55aa-000000000002` |

Build with `custom_usermods = led4you_ble` and `-D LED4YOU_BLE` (the define keeps Wi-Fi modem sleep
enabled, which ESP-IDF requires when Wi-Fi and Bluetooth run together).
Can be switched off in *Config → Usermods* (takes effect after reboot).

## v7 additions

- **My LEDs** effect: each LED has its own colour, behaviour (fixed, blink, breathe, twinkle, rainbow) and speed,
  stored in `/myleds.bin` (`"L4Y"`, version 1, LED count as uint16 LE, then 6 bytes per LED: r, g, b, mode, speed, phase).
- **LED4YOU Studio** page at `/studio` (text and My LEDs editors over Wi-Fi). Source in `studio/`; rebuild the
  embedded page with `node usermods/led4you_ble/studio/build_studio.js`.
- Bluetooth additions: JSON commands up to 4 KB (pixel art), `{"l4ycfg":{...}}` for LED hardware settings
  (saves and restarts), FILE characteristic `...0003` for GIF / table uploads (begin, data, end, delete packets,
  ack by notification), LIST characteristic `...0004` with the stored GIF names.
