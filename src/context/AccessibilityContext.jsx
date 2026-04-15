import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export function useAccessibility() {
    return useContext(AccessibilityContext);
}

export function AccessibilityProvider({ children }) {
    const [isHighContrast, setIsHighContrast] = useState(() => {
        const saved = localStorage.getItem('isHighContrast');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('isHighContrast', isHighContrast);
        if (isHighContrast) {
            document.documentElement.classList.add('high-contrast-mode');
        } else {
            document.documentElement.classList.remove('high-contrast-mode');
        }
    }, [isHighContrast]);

    const toggleHighContrast = () => {
        setIsHighContrast(!isHighContrast);
    };

    return (
        <AccessibilityContext.Provider value={{ isHighContrast, toggleHighContrast }}>
            {children}
        </AccessibilityContext.Provider>
    );
}
