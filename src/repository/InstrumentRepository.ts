import { db } from './db';
import { AppSettings, Instrument } from '../types';

export const DEFAULT_INSTRUMENT_CODE = 'XAUUSD';
export const DEFAULT_INSTRUMENT_ID = 'instrument-xauusd';
export const APP_SETTINGS_ID = 'app-settings';

export function normalizeInstrumentCode(code: string): string {
  return code.trim().toUpperCase();
}

export function hasDuplicateInstrumentCode(code: string, instruments: Pick<Instrument, 'code'>[]): boolean {
  const normalizedCode = normalizeInstrumentCode(code);
  return instruments.some(instrument => normalizeInstrumentCode(instrument.code) === normalizedCode);
}

export class InstrumentRepository {
  async getAll(): Promise<Instrument[]> {
    return db.instruments.orderBy('sortOrder').toArray();
  }

  async getActive(): Promise<Instrument[]> {
    const instruments = await db.instruments.filter(instrument => instrument.isActive).toArray();
    return instruments.sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
  }

  async getByCode(code: string): Promise<Instrument | undefined> {
    const normalizedCode = normalizeInstrumentCode(code);
    if (!normalizedCode) return undefined;
    return db.instruments.where('code').equals(normalizedCode).first();
  }

  async add(input: Omit<Instrument, 'code' | 'schemaVersion' | 'createdAt' | 'updatedAt'> & { code: string; schemaVersion?: number; createdAt?: string; updatedAt?: string }): Promise<void> {
    const now = new Date().toISOString();
    const code = normalizeInstrumentCode(input.code);
    if (!code || code === 'UNSET') {
      throw new Error('Instrument code must not be empty or UNSET.');
    }

    const existing = await this.getByCode(code);
    if (existing) {
      throw new Error('Instrument code already exists.');
    }

    const instrument: Instrument = {
      ...input,
      code,
      schemaVersion: input.schemaVersion ?? 5,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    };

    await db.instruments.add(instrument);
  }

  async update(id: string, changes: Partial<Omit<Instrument, 'id' | 'createdAt'>>): Promise<void> {
    const existing = await db.instruments.get(id);
    if (!existing) throw new Error('Instrument not found.');

    const normalizedChanges = { ...changes };
    if (typeof changes.code === 'string') {
      const code = normalizeInstrumentCode(changes.code);
      if (!code || code === 'UNSET') {
        throw new Error('Instrument code must not be empty or UNSET.');
      }
      normalizedChanges.code = code;
    }

    await db.instruments.update(id, {
      ...normalizedChanges,
      updatedAt: new Date().toISOString(),
    });
  }

  async ensureInitialInstruments(): Promise<void> {
    const now = new Date().toISOString();
    await db.transaction('rw', db.instruments, db.settings, async () => {
      const existingDefaultInstrument = await db.instruments.where('code').equals(DEFAULT_INSTRUMENT_CODE).first();
      if (!existingDefaultInstrument) {
        await db.instruments.put({
          id: DEFAULT_INSTRUMENT_ID,
          schemaVersion: 5,
          code: DEFAULT_INSTRUMENT_CODE,
          displayName: 'ゴールド／米ドル',
          assetClass: 'Metal',
          isActive: true,
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      const settings = await getAppSettings();
      const currentDefaultSymbol = normalizeInstrumentCode(settings?.defaultSymbol ?? '');
      const defaultExists = currentDefaultSymbol ? await db.instruments.where('code').equals(currentDefaultSymbol).first() : undefined;
      if (!settings || !currentDefaultSymbol || !defaultExists) {
        const newSettings: AppSettings = {
          id: settings?.id ?? APP_SETTINGS_ID,
          schemaVersion: 5,
          createdAt: settings?.createdAt ?? now,
          updatedAt: now,
          defaultSymbol: DEFAULT_INSTRUMENT_CODE,
        };
        await db.settings.put(newSettings);
      } else if (settings.defaultSymbol !== currentDefaultSymbol) {
        await db.settings.update(settings.id, { defaultSymbol: currentDefaultSymbol, updatedAt: now, schemaVersion: Math.max(settings.schemaVersion ?? 1, 5) });
      }
    });
  }
}

async function getAppSettings(): Promise<AppSettings | undefined> {
  const preferred = await db.settings.get(APP_SETTINGS_ID);
  if (preferred) return preferred;
  return db.settings.toCollection().first();
}

export const instrumentRepository = new InstrumentRepository();
