import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ToastType } from '../components/Toast';

interface UseFormSubmissionOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: string;
  clearForm?: () => void;
}

export const useFormSubmission = (options: UseFormSubmissionOptions = {}) => {
  const navigate = useNavigate();
  const {
    onSuccess,
    onError,
    successMessage = 'Operation completed successfully!',
    errorMessage = 'An error occurred. Please try again.',
    redirectTo,
    clearForm,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: ToastType;
  }>({
    isVisible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  const handleSubmit = async (
    submitFn: () => Promise<any>,
    customSuccessMessage?: string,
    customErrorMessage?: string
  ) => {
    setIsLoading(true);
    try {
      const response = await submitFn();
      
      // Check if response indicates success (status 200 or 201)
      const status = response?.status || (response?.data ? 200 : null);
      if (status === 200 || status === 201 || response) {
        // Show success message
        const message = customSuccessMessage || successMessage;
        showToast(message, 'success');
        
        // Execute success callback
        if (onSuccess) {
          onSuccess();
        }
        
        // Clear form if provided
        if (clearForm) {
          clearForm();
        }
        
        // Redirect if provided (after a short delay to show toast)
        if (redirectTo) {
          setTimeout(() => {
            navigate(redirectTo);
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      // Extract error message
      let message = customErrorMessage || errorMessage;
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (typeof errors === 'object') {
          const firstError = Object.values(errors)[0];
          message = Array.isArray(firstError) ? firstError[0] : String(firstError);
        } else {
          message = String(errors);
        }
      } else if (error?.message) {
        message = error.message;
      }
      
      // Show error message
      showToast(message, 'error');
      
      // Execute error callback
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    toast,
    hideToast,
    handleSubmit,
    showToast,
  };
};

