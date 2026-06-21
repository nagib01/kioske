import { describe, it, expect, beforeEach } from 'vitest';
import {
  backofficeHeaders,
  clearBackofficeSession,
  getBackofficeToken,
  BACKOFFICE_KEYS,
} from '../../lib/auth';

beforeEach(() => {
  localStorage.clear();
});

describe('backofficeHeaders', () => {
  it('returns only Content-Type when no token is stored', () => {
    expect(backofficeHeaders()).toEqual({ 'Content-Type': 'application/json' });
  });

  it('adds Authorization when a token is stored', () => {
    localStorage.setItem(BACKOFFICE_KEYS.token, 'abc');
    expect(backofficeHeaders().Authorization).toBe('Bearer abc');
  });

  it('adds x-escola-id only when requested and present', () => {
    localStorage.setItem(BACKOFFICE_KEYS.token, 'abc');
    localStorage.setItem(BACKOFFICE_KEYS.escola, '7');
    expect(backofficeHeaders({ escola: true })['x-escola-id']).toBe('7');
    expect(backofficeHeaders()['x-escola-id']).toBeUndefined();
  });
});

describe('getBackofficeToken', () => {
  it('reads the stored token', () => {
    expect(getBackofficeToken()).toBeNull();
    localStorage.setItem(BACKOFFICE_KEYS.token, 'xyz');
    expect(getBackofficeToken()).toBe('xyz');
  });
});

describe('clearBackofficeSession', () => {
  it('removes all backoffice keys', () => {
    Object.values(BACKOFFICE_KEYS).forEach((k) => localStorage.setItem(k, 'v'));
    clearBackofficeSession();
    Object.values(BACKOFFICE_KEYS).forEach((k) => expect(localStorage.getItem(k)).toBeNull());
  });
});
