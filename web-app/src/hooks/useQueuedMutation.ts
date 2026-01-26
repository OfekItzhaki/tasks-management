import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

/**
 * Hook that wraps React Query mutations to queue them asynchronously
 * and prevent UI blocking when multiple mutations are triggered rapidly.
 * 
 * Key features:
 * 1. Optimistic updates happen IMMEDIATELY (synchronously) - UI updates instantly
 * 2. API calls are queued using setTimeout(0) to yield to event loop
 * 3. Multiple rapid clicks all apply optimistic updates immediately
 * 4. No button disabling - UI always remains responsive
 */
export function useQueuedMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const mutation = useMutation(options);
  // Track pending mutations to prevent duplicate API calls for same action
  const pendingRef = useRef<Map<string, boolean>>(new Map());

  const queuedMutate = useCallback(
    (variables: TVariables, mutateOptions?: Parameters<typeof mutation.mutate>[1]) => {
      // STEP 1: Apply optimistic update IMMEDIATELY (synchronously)
      // This MUST happen before any async work to ensure UI updates instantly
      let context: TContext | undefined;
      if (options.onMutate) {
        try {
          const result = options.onMutate(variables);
          // Handle both sync and async onMutate
          if (result && typeof result === 'object' && 'then' in result) {
            // It's a promise - resolve it but don't wait
            (result as Promise<TContext>)
              .then((ctx) => {
                context = ctx;
              })
              .catch(() => {
                // Ignore errors in onMutate promise
              });
          } else {
            context = result as TContext;
          }
        } catch (error) {
          // If onMutate throws, continue anyway
          console.warn('onMutate error:', error);
        }
      }

      // STEP 2: Queue the actual API call using setTimeout(0)
      // This yields to the event loop, allowing UI to remain responsive
      // Multiple rapid clicks will all queue their API calls without blocking
      const mutationKey = JSON.stringify(variables);
      
      // Prevent duplicate API calls for the exact same mutation
      if (pendingRef.current.has(mutationKey)) {
        return; // Already queued, skip
      }
      
      pendingRef.current.set(mutationKey, true);

      // Use setTimeout(0) instead of queueMicrotask for better browser compatibility
      // and to ensure it runs in the next event loop tick
      setTimeout(() => {
        mutation.mutate(
          variables,
          {
            ...mutateOptions,
            onError: (error, vars, ctx) => {
              const errorContext = ctx ?? context;
              mutateOptions?.onError?.(error, vars, errorContext);
              options.onError?.(error, vars, errorContext);
              pendingRef.current.delete(mutationKey);
            },
            onSuccess: (data, vars, ctx) => {
              const successContext = ctx ?? context;
              mutateOptions?.onSuccess?.(data, vars, successContext);
              options.onSuccess?.(data, vars, successContext);
              pendingRef.current.delete(mutationKey);
            },
            onSettled: (data, error, vars, ctx) => {
              const settledContext = ctx ?? context;
              mutateOptions?.onSettled?.(data, error, vars, settledContext);
              options.onSettled?.(data, error, vars, settledContext);
              pendingRef.current.delete(mutationKey);
            },
          }
        );
      }, 0);
    },
    [mutation, options]
  );

  return {
    ...mutation,
    mutate: queuedMutate,
    mutateAsync: mutation.mutateAsync,
  } as UseMutationResult<TData, TError, TVariables, TContext>;
}
