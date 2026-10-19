# NeoPixelBus patch for LED4YOU on ESP32-C3

`NeoEsp32RmtMethod.h` from NeoPixelBus 2.7.9 with LED4YOU changes (search for "LED4YOU" / `L4Y_SPI_LEDS`),
active only when building for the ESP32-C3 with `LED4YOU_BLE`:

- **v42:** the LED output is sent with **SPI + DMA** (SPI2, MOSI on the LED GPIO, 3 SPI bits per LED bit,
  2.4 MHz for WS2812). The RMT on the C3 holds only two LEDs at a time and needs an interrupt to refill it during
  the frame; with Bluetooth on, that interrupt is late and LEDs get wrong colours. SPI DMA sends the whole frame
  from RAM with no CPU help. Inverted-signal chips (TM1814/TM1829/TM1914) and very long strips still use RMT.
- **v40:** the RMT fallback uses two memory blocks on channel 0.

The C3 build has one LED output (`WLED_MAX_RMT_CHANNELS 1` in `wled00/const.h` when `LED4YOU_BLE` is defined).
Hardware-SPI LED types (APA102 etc.) cannot be used together with it on the C3.

Copy this file over `NeoPixelBus/src/internal/methods/NeoEsp32RmtMethod.h` in the library
folder used by PlatformIO before building `led4you_c3`.
