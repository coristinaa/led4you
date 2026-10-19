#include "wled.h"

/*
 * Support for DMX  output via serial (e.g. MAX485).
 * Change the output pin in src/dependencies/ESPDMX.cpp, if needed (ESP8266)
 * Change the output pin in src/dependencies/SparkFunDMX.cpp, if needed (ESP32)
 * ESP8266 Library from:
 * https://github.com/Rickgg/ESP-Dmx
 * ESP32 Library from:
 * https://github.com/sparkfun/SparkFunDMX
 */

#ifdef WLED_ENABLE_DMX

// LED4YOU: DMX output is switched on and its pin chosen in Config > Usermods > LED4YOU Extras (applied at boot)
bool l4yDmxOutOn = false;
int8_t l4yDmxOutPin = -1;
static bool l4yDmxOutStarted = false;

void handleDMXOutput()
{
  if (!l4yDmxOutStarted) return;
  // a frame blocks the loop while it is sent: about 40 frames per second are plenty for DMX fixtures
  static unsigned long lastFrame = 0;
  if (millis() - lastFrame < 25) return;
  lastFrame = millis();
  // don't act, when in DMX Proxy mode
  if (e131ProxyUniverse != 0) return;

  uint8_t brightness = strip.getBrightness();

  bool calc_brightness = true;

   // check if no shutter channel is set
   for (unsigned i = 0; i < DMXChannels; i++)
   {
     if (DMXFixtureMap[i] == 5) calc_brightness = false;
   }

  uint16_t len = strip.getLengthTotal();
  for (int i = DMXStartLED; i < len; i++) {        // uses the amount of LEDs as fixture count

    uint32_t in = strip.getPixelColor(i);     // get the colors for the individual fixtures as suggested by Aircoookie in issue #462
    byte w = W(in);
    byte r = R(in);
    byte g = G(in);
    byte b = B(in);

    int DMXFixtureStart = DMXStart + (DMXGap * (i - DMXStartLED));
    for (int j = 0; j < DMXChannels; j++) {
      int DMXAddr = DMXFixtureStart + j;
      switch (DMXFixtureMap[j]) {
        case 0:        // Set this channel to 0. Good way to tell strobe- and fade-functions to fuck right off.
          dmx.write(DMXAddr, 0);
          break;
        case 1:        // Red
          dmx.write(DMXAddr, calc_brightness ? (r * brightness) / 255 : r);
          break;
        case 2:        // Green
          dmx.write(DMXAddr, calc_brightness ? (g * brightness) / 255 : g);
          break;
        case 3:        // Blue
          dmx.write(DMXAddr, calc_brightness ? (b * brightness) / 255 : b);
          break;
        case 4:        // White
          dmx.write(DMXAddr, calc_brightness ? (w * brightness) / 255 : w);
          break;
        case 5:        // Shutter channel. Controls the brightness.
          dmx.write(DMXAddr, brightness);
          break;
        case 6:        // Sets this channel to 255. Like 0, but more wholesome.
          dmx.write(DMXAddr, 255);
          break;
      }
    }
  }

  dmx.update();        // update the DMX bus
}

void initDMXOutput() {
  if (!l4yDmxOutOn || l4yDmxOutPin < 0) return;
  if (!PinManager::allocatePin(l4yDmxOutPin, true, PinOwner::DMX)) return;   // pin used by the LEDs or something else
 #if defined(ESP8266) || defined(CONFIG_IDF_TARGET_ESP32C3) || defined(CONFIG_IDF_TARGET_ESP32S2)
  extern int sendPin;
  sendPin = l4yDmxOutPin;
  dmx.init(24);         // starts small, grows to the highest channel in use
 #else
  extern int sparkfunDmxTxPin;
  sparkfunDmxTxPin = l4yDmxOutPin;
  dmx.initWrite(24);
 #endif
  l4yDmxOutStarted = true;
}
#else
void initDMXOutput(){}
void handleDMXOutput() {}
#endif
