import { toast } from 'sonner';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class AppError extends Error {
  public readonly code?: string;
  public readonly status?: number;
  public readonly details?: any;

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Error handling utility functions
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    const { data, status } = error.response;
    return {
      message: data?.error || data?.message || 'An error occurred',
      code: data?.code,
      status,
      details: data
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      status: 0
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    };
  }
};

// Toast notification helpers
export const showErrorToast = (error: string | ApiError) => {
  const message = typeof error === 'string' ? error : error.message;
  toast.error(message);
};

export const showSuccessToast = (message: string) => {
  toast.success(message);
};

export const showInfoToast = (message: string) => {
  toast.info(message);
};

export const showWarningToast = (message: string) => {
  toast.warning(message);
};

// Async operation wrapper with error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  options?: {
    showToast?: boolean;
    customErrorMessage?: string;
    onError?: (error: ApiError) => void;
    onSuccess?: (result: T) => void;
    successMessage?: string;
  }
): Promise<{ data?: T; error?: ApiError }> => {
  try {
    const result = await operation();
    
    if (options?.onSuccess) {
      options.onSuccess(result);
    }
    
    if (options?.successMessage) {
      showSuccessToast(options.successMessage);
    }
    
    return { data: result };
  } catch (err) {
    const error = handleApiError(err);
    
    if (options?.customErrorMessage) {
      error.message = options.customErrorMessage;
    }
    
    if (options?.onError) {
      options.onError(error);
    }
    
    if (options?.showToast !== false) {
      showErrorToast(error);
    }
    
    return { error };
  }
};

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAmount = (amount: string, min?: number, max?: number): { isValid: boolean; error?: string } => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  
  if (min !== undefined && numAmount < min) {
    return { isValid: false, error: `Minimum amount is ${min}` };
  }
  
  if (max !== undefined && numAmount > max) {
    return { isValid: false, error: `Maximum amount is ${max}` };
  }
  
  return { isValid: true };
};

// Retry mechanism for failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
};

// Form validation helper
export const createFormValidator = <T extends Record<string, any>>(
  validationRules: {
    [K in keyof T]?: (value: T[K]) => string | null;
  }
) => {
  return (formData: T): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
    const errors: Partial<Record<keyof T, string>> = {};
    
    for (const [field, validator] of Object.entries(validationRules)) {
      if (validator && typeof validator === 'function') {
        const error = validator(formData[field as keyof T]);
        if (error) {
          errors[field as keyof T] = error;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
};