
import { useEffect, useRef } from 'react';

export const useFocusTrap = (modalRef: React.RefObject<HTMLElement>, isOpen: boolean, onClose?: () => void) => {
    const lastFocusedElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            lastFocusedElement.current = document.activeElement as HTMLElement;
            modalRef.current?.focus();

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape' && onClose) {
                    onClose();
                }

                if (event.key === 'Tab') {
                    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (!focusableElements || focusableElements.length === 0) return;

                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];

                    if (event.shiftKey) { // Shift + Tab
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            event.preventDefault();
                        }
                    } else { // Tab
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            event.preventDefault();
                        }
                    }
                }
            };
            
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                lastFocusedElement.current?.focus();
            };
        }
    }, [isOpen, onClose, modalRef]);
};