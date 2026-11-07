import { indexedDBStorage } from '../database/adapters/IndexedDBAdapter';

export interface DeviceSyncInfo {
  deviceId: string;
  deviceName?: string;
  lastSyncAt: string | null;
  serverUrl?: string;
  autoSyncEnabled: boolean;
}

const SYNC_CONFIG_KEY = 'suite_sync_config_v1';

export class SyncState {
  public static getConfig(): DeviceSyncInfo {
    const defaultCfg: DeviceSyncInfo = {
      deviceId: 'device_' + Math.random().toString(36).substring(2, 8),
      autoSyncEnabled: true,
      lastSyncAt: null,
    };
    const saved = indexedDBStorage.getItemSync<DeviceSyncInfo>(SYNC_CONFIG_KEY);
    return saved ? { ...defaultCfg, ...saved } : defaultCfg;
  }

  public static saveConfig(cfg: Partial<DeviceSyncInfo>): void {
    const current = SyncState.getConfig();
    indexedDBStorage.setItemSync(SYNC_CONFIG_KEY, { ...current, ...cfg });
  }
}
