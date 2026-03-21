interface Props {
  open: boolean;
  onToggle: () => void;
  connected: boolean;
  connectionType: 'serial' | 'bluetooth';
  onConnectionTypeChange: (type: 'serial' | 'bluetooth') => void;
  screenSize: number;
  onScreenSizeChange: (size: number) => void;
  brightness: number;
  onBrightnessChange: (brightness: number) => void;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function DeviceDrawer({
  open,
  onToggle,
  connected,
  connectionType,
  onConnectionTypeChange,
  screenSize,
  onScreenSizeChange,
  brightness,
  onBrightnessChange,
  onConnect,
  onDisconnect,
}: Props) {
  return (
    <div className="w-full max-w-sm">
      <button
        className="btn btn-sm w-full justify-between bg-[#789ac7] text-white border-none hover:bg-[#6a8ab7]"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-base-content/30'}`}
          />
          Connect your LED grid
        </span>
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="card bg-[#a8bfd8] shadow-md mt-2 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Connection</span>
            <select
              className="select select-sm select-bordered"
              value={connectionType}
              disabled={connected}
              onChange={(e) => {
                onConnectionTypeChange(e.target.value as 'serial' | 'bluetooth');
              }}
            >
              <option value="serial">Serial</option>
              <option value="bluetooth">Bluetooth</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Screen size</span>
            <select
              className="select select-sm select-bordered"
              value={screenSize}
              disabled={connected}
              onChange={(e) => {
                onScreenSizeChange(parseInt(e.target.value));
              }}
            >
              <option value={16}>16×16</option>
              <option value={22}>22×22</option>
              <option value={32}>32×32</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Brightness</span>
            <select
              className="select select-sm select-bordered"
              value={brightness}
              onChange={(e) => {
                onBrightnessChange(parseInt(e.target.value));
              }}
            >
              <option value={255}>Full</option>
              <option value={128}>50%</option>
              <option value={64}>25%</option>
              <option value={32}>13%</option>
              <option value={16}>6%</option>
            </select>
          </div>

          {connected ? (
            <button
              className="btn btn-error btn-sm w-full"
              onClick={() => {
                void onDisconnect();
              }}
            >
              Disconnect
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm w-full"
              onClick={() => {
                void onConnect();
              }}
            >
              Connect
            </button>
          )}
        </div>
      )}
    </div>
  );
}
