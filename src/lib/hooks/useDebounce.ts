import { useState, useEffect } from 'react';

/**
 * Generic debounce hook to delay updating a value until after a specified
 * delay has elapsed since the last change.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 300ms)
 * @returns The debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(timer); };
    }, [value, delay]);

    return debouncedValue;
}

export default useDebounce;