import { AsyncBlockingQueue } from './queue.mjs';

const SERVICE_UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UART_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UART_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

const CONNECTION_MTU = 100;

export class BluetoothConnection {
    constructor() {
        this.readQueue = new AsyncBlockingQueue();
    }

    async read() {
        return this.readQueue.dequeue();
    }

    async write(data) {
        console.log(`Writing ${data.length} bytes...`);
        let start = 0;
        while (start < data.length) {
            let end = Math.min(start + CONNECTION_MTU, data.length);
            await this.rxCharacteristic.writeValue(data.slice(start, end));
            start = end;
        }        
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

        // Setup listening for values and adding to the queue.
        await this.txCharacteristic.startNotifications();
        const handleNotifications = (event) => {
            this.readQueue.enqueue(event.target.value);
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
}