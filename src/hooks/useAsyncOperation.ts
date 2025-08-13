import { useState, useCallback } from 'react';
import { ApiError, handleApiError, showErrorToast } from '../utils/errorHandling';

interface UseAsyncOperationOptions {
  showErrorToast?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export const useAsyncOperation = <T = any>(options: UseAsyncOperationOptions = {}) => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();
      setState({ data: result, loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = handleApiError(err);
      setState(prev => ({ ...prev, loading: false, error }));
      
      if (options.showErrorToast !== false) {
        showErrorToast(error);
      }
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: ApiError | string) => {
    const apiError = typeof error === 'string' ? { message: error } : error;
    setState(prev => ({ ...prev, error: apiError }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError
  };
};

// Specialized hook for form submissions
export const useFormSubmission = <T = any>(options: UseAsyncOperationOptions = {}) => {
  const { execute, loading, error, reset } = useAsyncOperation<T>(options);
  
  const submit = useCallback(async (formData: any, submitFn: (data: any) => Promise<T>) => {
    return execute(() => submitFn(formData));
  }, [execute]);

  return {
    submit,
    loading,
    error,
    reset,
    isSubmitting: loading
  };
};

// Hook for data fetching with automatic loading states
export const useDataFetching = <T = any>(options: UseAsyncOperationOptions = {}) => {
  const { execute, data, loading, error, reset, setData } = useAsyncOperation<T>(options);
  
  const fetch = useCallback(async (fetchFn: () => Promise<T>) => {
    return execute(fetchFn);
  }, [execute]);

  const refetch = useCallback(async (fetchFn: () => Promise<T>) => {
    reset();
    return fetch(fetchFn);
  }, [fetch, reset]);

  return {
    data,
    loading,
    error,
    fetch,
    refetch,
    reset,
    setData,
    isLoading: loading,
    hasError: !!error,
    hasData: !!data
  };
};

// Hook for handling multiple async operations
export const useMultipleAsyncOperations = () => {
  const [operations, setOperations] = useState<Record<string, AsyncOperationState<any>>>({});

  const execute = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    options: UseAsyncOperationOptions = {}
  ) => {
    setOperations(prev => ({
      ...prev,
      [key]: { data: null, loading: true, error: null }
    }));

    try {
      const result = await operation();
      setOperations(prev => ({
        ...prev,
        [key]: { data: result, loading: false, error: null }
      }));
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = handleApiError(err);
      setOperations(prev => ({
        ...prev,
        [key]: { data: null, loading: false, error }
      }));
      
      if (options.showErrorToast !== false) {
        showErrorToast(error);
      }
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }, []);

  const getOperation = useCallback((key: string) => {
    return operations[key] || { data: null, loading: false, error: null };
  }, [operations]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setOperations(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      setOperations({});
    }
  }, []);

  const isAnyLoading = Object.values(operations).some(op => op.loading);
  const hasAnyError = Object.values(operations).some(op => op.error);

  return {
    execute,
    getOperation,
    reset,
    operations,
    isAnyLoading,
    hasAnyError
  };
};