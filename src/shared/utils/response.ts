export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  timestamp: string;
}

export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  status: 'success',
  data,
  ...(message && { message }),
  timestamp: new Date().toISOString(),
});

export const createErrorResponse = (message: string): ApiResponse => ({
  status: 'error',
  message,
  timestamp: new Date().toISOString(),
});
