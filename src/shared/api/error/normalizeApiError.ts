import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import type { ApiError } from '@/shared/api';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const isFetchBaseQueryError = (
  error: unknown,
): error is FetchBaseQueryError => isRecord(error) && 'status' in error;

const getBackendErrorCode = (data: unknown): string | null => {
  if (!isRecord(data) || !isRecord(data.error)) {
    return null;
  }

  return typeof data.error.code === 'string' ? data.error.code : null;
};

export const normalizeApiError = (error: unknown): ApiError => {
  if (!isFetchBaseQueryError(error)) {
    return { code: null, kind: 'unknown', status: null };
  }

  if (typeof error.status === 'number') {
    return {
      code: getBackendErrorCode(error.data),
      kind: error.status >= 500 ? 'server' : 'client',
      status: error.status,
    };
  }

  switch (error.status) {
    case 'FETCH_ERROR':
      return { code: null, kind: 'network', status: null };
    case 'TIMEOUT_ERROR':
      return { code: null, kind: 'timeout', status: null };
    case 'PARSING_ERROR':
      return {
        code: getBackendErrorCode(error.data),
        kind: 'parsing',
        status: error.originalStatus,
      };
    default:
      return { code: null, kind: 'unknown', status: null };
  }
};
