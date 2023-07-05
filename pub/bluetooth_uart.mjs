const SERVICE_UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UART_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UART_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

const CONNECTION_MTU = 100;

export class UartBluetooth {
    constructor() {
        this.connected = false;
    }

    async connect() {
        if (!navigator.bluetooth) {
            throw new Error('WebBluetooth API is not available.');
        }

        this.device = await navigator.bluetooth.requestDevice({
            filters: [{name: ["mpy-uart"]}],
            optionalServices: [SERVICE_UART],
            acceptAllDevices: false,
        });

        const onDisconnected = () => {
            this.connected = false;
        };

        this.device.addEventListener('gattserverdisconnected', onDisconnected);

        this.server = await this.device.gatt.connect();
        this.service = await this.server.getPrimaryService(SERVICE_UART);
        this.rxCharacteristic = await this.service.getCharacteristic(CHARACTERISTIC_UART_RX);
        this.txCharacteristic = await this.service.getCharacteristic(CHARACTERISTIC_UART_TX);
        await this.txCharacteristic.startNotifications();

        const handleNotifications = (event) => {
            const value = event.target.value;
            // TODO: Try using TextDecoder instead.
            let str = "";
            for (let i = 0; i < value.byteLength; i++) {
                str += String.fromCharCode(value.getUint8(i));
            }
            console.log(str);
        };
        this.txCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);
        this.connected = true;
    }

    async disconnect() {
        if (!this.connected) {
            return;
        }

        if (!this.device) {
            console.log('No Bluetooth Device connected.');
            return;
        }

        if (!this.device.connected) {
            console.log("Device is already disconnected.");
            return;
        }

        await this.device.disconnect();
    }

    async sendImage(imageData) {
        const numPixels = 32 * 32;
        const byteLength = numPixels * 3;
        let buffer = new Uint8Array(byteLength);
        for (let i = 0; i < 1024; i++) {
          // imageData is RGBA, but we ignore the alpha channel.
          let red = imageData[i * 4];
          let green = imageData[i * 4 + 1];
          let blue = imageData[i * 4 + 2];
    
          // Buffer is RGB
          buffer[i * 3] = red; //gamma(red, brightness);
          buffer[i * 3 + 1] = green;//gamma(green, brightness);
          buffer[i * 3 + 2] = blue; //gamma(blue, brightness);
        }

        let start = 0;
        while (start < buffer.length) {
            let end = Math.min(start + CONNECTION_MTU, buffer.length);
            console.log(start, end);
            await this.rxCharacteristic.writeValue(buffer.slice(start, end));
            start = end;
        }        
    }
}
