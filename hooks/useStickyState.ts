import { useState, useEffect } from 'react';

export function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        if (typeof window !== "undefined") {
            try {
                const stickyValue = window.localStorage.getItem(key);
                return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
            } catch (error) {
                console.warn(`Error reading ${key} from localStorage`, error);
                return defaultValue;
            }
        }
        return defaultValue;
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.warn(`Error saving ${key} to localStorage`, error);
            }
        }
    }, [key, value]);

    return [value, setValue];
}
