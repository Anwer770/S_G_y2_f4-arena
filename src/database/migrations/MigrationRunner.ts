import { indexedDBStorage } from '../adapters/IndexedDBAdapter';

export interface MigrationStep {
  version: number;
  description: string;
  up: () => void | Promise<void>;
}

const MIGRATION_VERSION_KEY = 'suite_db_schema_version';

export class MigrationRunner {
  private static migrations: MigrationStep[] = [
    {
      version: 1,
      description: 'Initial schema and seed migration',
      up: () => {
        // Version 1 baseline
      },
    },
    {
      version: 2,
      description: 'IndexedDB engine upgrade and outbox queue init',
      up: () => {
        // Handled dynamically by IndexedDBAdapter
      },
    },
  ];

  public static async runMigrations(): Promise<number> {
    const currentVersion = indexedDBStorage.getItemSync<number>(MIGRATION_VERSION_KEY) || 0;
    let latestVersion = currentVersion;

    for (const step of this.migrations) {
      if (step.version > currentVersion) {
        try {
          await step.up();
          latestVersion = step.version;
          indexedDBStorage.setItemSync(MIGRATION_VERSION_KEY, latestVersion);
        } catch (e) {
          console.error(`Migration v${step.version} failed:`, e);
          break;
        }
      }
    }

    return latestVersion;
  }
}
