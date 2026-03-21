export interface DeviceConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  write(data: Uint8Array): Promise<void>;
  read(): Promise<Uint8Array | undefined>;
}
