import { describe, expect, it } from 'vitest';
import { hasDuplicateInstrumentCode, normalizeInstrumentCode } from './InstrumentRepository';
import { Instrument } from '../types';
import { buildInstrumentOptions, resolveInitialTradeSymbol } from '../pages/TradeForm';

const activeXauusd: Instrument = {
  id: 'instrument-xauusd',
  schemaVersion: 5,
  code: 'XAUUSD',
  displayName: 'ゴールド／米ドル',
  assetClass: 'Metal',
  isActive: true,
  sortOrder: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const activeBtcusd: Instrument = {
  ...activeXauusd,
  id: 'instrument-btcusd',
  code: 'BTCUSD',
  displayName: 'Bitcoin / US Dollar',
  assetClass: 'Crypto',
  sortOrder: 2,
};

const inactiveEurusd: Instrument = {
  ...activeXauusd,
  id: 'instrument-eurusd',
  code: 'EURUSD',
  displayName: 'Euro / US Dollar',
  assetClass: 'FX',
  isActive: false,
  sortOrder: 3,
};

describe('instrument master defaults', () => {
  it('normalizes code by trimming surrounding whitespace', () => {
    expect(normalizeInstrumentCode('  xauusd  ')).toBe('XAUUSD');
  });

  it('normalizes code to uppercase for case-insensitive uniqueness', () => {
    expect(normalizeInstrumentCode('xAuUsD')).toBe('XAUUSD');
  });

  it('detects duplicate codes without case sensitivity', () => {
    expect(hasDuplicateInstrumentCode(' xauusd ', [activeXauusd])).toBe(true);
  });

  it('selects XAUUSD for a new trade when there is no draft or valid default', () => {
    expect(resolveInitialTradeSymbol({ activeInstruments: [activeXauusd], defaultSymbol: '', draftSymbol: undefined })).toBe('XAUUSD');
  });

  it('keeps a draft symbol before app settings and XAUUSD', () => {
    expect(resolveInitialTradeSymbol({ activeInstruments: [activeXauusd, activeBtcusd], defaultSymbol: 'XAUUSD', draftSymbol: ' goldm ' })).toBe('GOLDM');
  });

  it('keeps a valid existing defaultSymbol', () => {
    expect(resolveInitialTradeSymbol({ activeInstruments: [activeXauusd, activeBtcusd], defaultSymbol: 'btcusd' })).toBe('BTCUSD');
  });

  it('does not show inactive instruments as new trade choices', () => {
    expect(buildInstrumentOptions([activeXauusd, inactiveEurusd], 'XAUUSD').map(option => option.code)).toEqual(['XAUUSD']);
  });

  it('adds an unregistered saved draft symbol as a temporary option without losing it', () => {
    expect(buildInstrumentOptions([activeXauusd], 'GOLDm')[0]).toEqual({ code: 'GOLDM', label: 'GOLDM — 保存済み銘柄' });
  });

  it('sorts active instruments by sortOrder', () => {
    expect(buildInstrumentOptions([activeBtcusd, activeXauusd], 'XAUUSD').map(option => option.code)).toEqual(['XAUUSD', 'BTCUSD']);
  });
});
