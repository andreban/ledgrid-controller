import { WritableStreamDefaultWriter } from 'stream/web';
import { DeviceConnection } from './connection';

export class SerialConnection implements DeviceConnection {
    private connected: boolean;
    private port?: SerialPort;
    private writer?: WritableStreamDefaultWriter<Uint8Array>;
    private reader?: ReadableStreamDefaultReader<Uint8Array>;

    constructor() {
        this.connected = false;
    }

    async disconnect() {
        await this.writer?.close();
        await this.reader?.cancel();
        await this.port?.close();
        this.connected = false;
    }

    async read(): Promise<Uint8Array | undefined> {
        if (!this.connected) {
            throw new Error("Not connected to a serial device.");        
        }

        const {value} = await this.reader!.read();
        return value;
    }

    async write(data: Uint8Array) {
        this.writer?.write(data);
    }

    async connect() {
        this.port = await navigator.serial.requestPort();
        await this.port.open({
          baudRate: 115200,
          dataBits: 8,
          stopBits: 1
        });
        this.writer = this.port?.writable?.getWriter()
        this.reader = this.port?.readable?.getReader();
        this.connected = true;
    }
}
