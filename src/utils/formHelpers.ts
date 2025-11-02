/**
 * Utility functions for form handling with toast notifications
 */

export const extractErrorMessage = (error: any, defaultMessage: string = 'An error occurred'): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  } else if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (typeof errors === 'object') {
      const firstError = Object.values(errors)[0];
      return Array.isArray(firstError) ? firstError[0] : String(firstError);
    }
    return String(errors);
  } else if (error?.message) {
    return error.message;
  }
  return defaultMessage;
};

export const isSuccessResponse = (response: any): boolean => {
  const status = response?.status || response?.data?.status || (response?.data ? 200 : null);
  return status === 200 || status === 201 || (response && !response.status);
};

