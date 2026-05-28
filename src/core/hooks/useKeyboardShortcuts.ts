import { useEffect } from 'react';
import { useCommandPalette } from '../../features/command/hooks';

export const useKeyboardShortcuts = () => {
    const { openPalette } = useCommandPalette();
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openPalette();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [openPalette]);
};
