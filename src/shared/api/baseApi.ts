import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Task', 'TaskView'],
  endpoints: () => ({}),
  catchSchemaFailure: (): FetchBaseQueryError => ({
    status: 'CUSTOM_ERROR',
    error: 'Response schema validation failed',
    data: {
      error: {
        code: 'invalid_response',
      },
    },
  }),
});
