const decoder = new TextDecoder();

export class LedGrid {
  constructor(connection, width, height) {
    this.connection = connection;
    this.width = width;
    this.height = height;
    this.readLoop(this.connection);
  }

  /**
   * Sends an image to the LED grid.
   * @param {Uint8ClampedArray } imageData 
   */
  async sendImage(imageData, brightness = 255) {
    if (!this.connection) {
      console.log('Connect to a device.');
      return;
    }

    const numColours = this.width * this.height;
    const buffer = new Uint8Array(numColours * 3);
    for (let i = 0; i < numColours; i++) {
      // imageData is RGBA, but we ignore the alpha channel.
      let red = imageData[i * 4];
      let green = imageData[i * 4 + 1];
      let blue = imageData[i * 4 + 2];

      // Buffer is RGB
      buffer[i * 3] = gamma(red, brightness);
      buffer[i * 3 + 1] = gamma(green, brightness);
      buffer[i * 3 + 2] = gamma(blue, brightness);
    }
    await this.connection.write(buffer);
  }

  async readLoop() {
      while (true) {
        const value = await this.connection.read();
        if (!value) {
          continue;
        }
        console.log(decoder.decode(value));
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
