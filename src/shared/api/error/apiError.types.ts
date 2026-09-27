export type ApiErrorKind = 'client' | 'network' | 'parsing' | 'server'
  | 'timeout' | 'unknown';

export interface ApiError {
  code: string | null;
  kind: ApiErrorKind;
  status: number | null;
}

export type ApiErrorFallbackKey = 'errors.createTask' | 'errors.generic'
  | 'errors.loadTasks' | 'errors.updateTask' | 'errors.deleteTask'
  | 'errors.restoreTask';
