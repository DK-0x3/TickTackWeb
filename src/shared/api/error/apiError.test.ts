import { describe, expect, it } from 'vitest';

import { getApiErrorTranslationKey } from './getApiErrorTranslationKey';
import { normalizeApiError } from './normalizeApiError';

describe('API error handling', () => {
  it('keeps backend error codes and distinguishes client and server failures', () => {
    expect(normalizeApiError({
      status: 400,
      data: { error: { code: 'invalid_pagination' } },
    })).toEqual({ code: 'invalid_pagination', kind: 'client', status: 400 });

    expect(normalizeApiError({ status: 503, data: {} })).toEqual({
      code: null,
      kind: 'server',
      status: 503,
    });
  });

  it('maps network, timeout, parsing and unexpected failures', () => {
    expect(normalizeApiError({ status: 'FETCH_ERROR', error: 'offline' }).kind).toBe('network');
    expect(normalizeApiError({ status: 'TIMEOUT_ERROR', error: 'timeout' }).kind).toBe('timeout');
    expect(normalizeApiError({ status: 'PARSING_ERROR', originalStatus: 502, data: 'bad', error: 'parse' })).toEqual({
      code: null,
      kind: 'parsing',
      status: 502,
    });
    expect(normalizeApiError(new Error('unexpected')).kind).toBe('unknown');
  });

  it('prefers specific error messages and uses a fallback for unknown failures', () => {
    expect(getApiErrorTranslationKey(
      { code: 'task_not_found', kind: 'client', status: 404 },
      'errors.generic',
    )).toBe('errors.taskNotFound');
    expect(getApiErrorTranslationKey(
      { code: null, kind: 'network', status: null },
      'errors.generic',
    )).toBe('errors.network');
    expect(getApiErrorTranslationKey(
      { code: null, kind: 'server', status: 500 },
      'errors.generic',
    )).toBe('errors.server');
    expect(getApiErrorTranslationKey(
      { code: null, kind: 'unknown', status: null },
      'errors.loadTasks',
    )).toBe('errors.loadTasks');
  });
});
