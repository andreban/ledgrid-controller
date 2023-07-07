export class SerialConnection {
    constructor() {
        this.connected = false;
    }

    async disconnect() {
        await this.writer.close();
        await this.reader.cancel();
        await this.port.close();
        this.connected = false;
    }

    async read() {
        const {value} = await this.reader.read();
        return value;
    }

    async write(data) {
        this.writer.write(data);
    }

    async connect() {
        this.port = await navigator.serial.requestPort();
        await port.open({
          baudRate: 115200,
          dateBits: 8,
          stopBits: 1
        });
        this.writer = port.writable.getWriter()
        this.reader = port.readable.getReader();
        this.connected = true;
    }
}
