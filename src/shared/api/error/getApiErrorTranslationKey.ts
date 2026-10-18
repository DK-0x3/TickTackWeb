import type {
  ApiError,
  ApiErrorFallbackKey,
} from './apiError.types';

const errorCodeKeys = {
  invalid_request: 'errors.invalidRequest',
  invalid_pagination: 'errors.invalidRequest',
  invalid_task_id: 'errors.invalidRequest',
  task_not_found: 'errors.taskNotFound',
  validation_failed: 'errors.validation',
  invalid_response: 'errors.invalidResponse',
} as const;

export const getApiErrorTranslationKey = (
  error: ApiError,
  fallbackKey: ApiErrorFallbackKey,
) => {
  if (error.code && error.code in errorCodeKeys) {
    return errorCodeKeys[error.code as keyof typeof errorCodeKeys];
  }

  if (error.kind === 'network') {
    return 'errors.network';
  }

  if (error.kind === 'timeout') {
    return 'errors.timeout';
  }

  if (error.kind === 'parsing') {
    return 'errors.invalidResponse';
  }

  if (error.status === 401) {
    return 'errors.unauthorized';
  }

  if (error.status === 403) {
    return 'errors.forbidden';
  }

  if (error.status === 404) {
    return 'errors.notFound';
  }

  if (error.status === 409) {
    return 'errors.conflict';
  }

  if (error.kind === 'server') {
    return 'errors.server';
  }

  return fallbackKey;
};
