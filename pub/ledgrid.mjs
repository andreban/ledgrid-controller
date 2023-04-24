
const decoder = new TextDecoder();

export class LedGrid {
  constructor(port) {
    this.port = port;
    this.writer = port.writable.getWriter()
    this.reader = port.readable.getReader();
    readLoop(this.reader);
  }

  /**
   * Sends an image to the LED grid.
   * @param {Uint8ClampedArray } imageData 
   */
  async sendImage(imageData, brightness = 255) {
    if (!this.writer) {
      console.log('Connect to a device.');
      return;
    }

    const length = 256 * 3;
    let buffer = new Uint8Array(length);
    for (let i = 0; i < 256; i++) {
      // imageData is RGBA, but we ignore the alpha channel.
      let red = imageData[i * 4];
      let green = imageData[i * 4 + 1];
      let blue = imageData[i * 4 + 2];

      // Buffer is RGB
      buffer[i * 3] = gamma(red, brightness);
      buffer[i * 3 + 1] = gamma(green, brightness);
      buffer[i * 3 + 2] = gamma(blue, brightness);
    }
    await this.writer.write(buffer);
    console.log(`Sent ${buffer.length} bytes.`);    
  }
  
  /**
   * Disconnects from the LED grid.
   */
  async disconnect() {
      await this.writer.close();
      await this.reader.cancel();
      await this.port.close();
  }
  
  /**
   * Coonects the to a LED grid connected to the serial port.
   * 
   * @returns a LedGrid connected to a serial port.
   */
  static async connect() {
    const port = await navigator.serial.requestPort();
    console.log(port);
    await port.open({
      baudRate: 115200,
      dateBits: 8,
      stopBits: 1
    });
    return new LedGrid(port);
  }
}

/**
 * An infinite loop reading from the serial port and printing to the console.
 */
async function readLoop(reader) {
  while (true) {
    const {value, done} = await reader.read();
    if (value) {
      console.log(decoder.decode(value));
    }
    if (done) {
      reader.releaseLock();
      break;
    }
  }      
}   

/**
 * Applies a gamma conversion to a colour channel to correct the colours displayed on the LED grid.
 */
function gamma(input, brightness) {
  if (input === 0) {
    return 0;
  }
  const gamma = 2.8;
  const maxInput = 255;
  const maxOutput = brightness;
  return Math.max(Math.pow(input / maxInput, gamma) * maxOutput, 1);
}
