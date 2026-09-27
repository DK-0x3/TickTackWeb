import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { ApiErrorFallbackKey } from './apiError.types';
import { getApiErrorTranslationKey } from './getApiErrorTranslationKey';
import { normalizeApiError } from './normalizeApiError';

export const useApiErrorMessage = () => {
  const { t } = useTranslation();

  return useCallback((
    error: unknown,
    fallbackKey: ApiErrorFallbackKey = 'errors.generic',
  ): string | null => {
    if (error === null || error === undefined) {
      return null;
    }

    const normalizedError = normalizeApiError(error);
    const translationKey = getApiErrorTranslationKey(
      normalizedError,
      fallbackKey,
    );

    return t(translationKey);
  }, [t]);
};
