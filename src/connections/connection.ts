export interface DeviceConnection {
    connect();
    disconnect();
    write(data: Uint8Array);
    read(): Promise<Uint8Array | undefined>;
}
