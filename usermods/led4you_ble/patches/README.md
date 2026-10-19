# NeoPixelBus patch for LED4YOU on ESP32-C3

`NeoEsp32RmtMethod.h` from NeoPixelBus 2.7.9 with one change (search for "LED4YOU"):
on the ESP32-C3 the first RMT channel uses two memory blocks (`mem_block_num = 2`).
The refill interrupt then fires half as often, so Bluetooth and Wi-Fi modem sleep no longer
delay it long enough to corrupt the LED data. The C3 build is limited to one LED output
(`WLED_MAX_RMT_CHANNELS 1` in `wled00/const.h` when `LED4YOU_BLE` is defined).

Copy this file over `NeoPixelBus/src/internal/methods/NeoEsp32RmtMethod.h` in the library
folder used by PlatformIO before building `led4you_c3`.
