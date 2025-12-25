
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertCircle, Download, Loader } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        if (type !== 'loading') { // Loading toasts don't auto-dismiss
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for animation
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose, type]);

    const icons = {
        success: <Check size={18} className="text-green-500" />,
        error: <AlertCircle size={18} className="text-red-500" />,
        info: <Download size={18} className="text-blue-500" />,
        loading: <Loader size={18} className="text-zuno-accent animate-spin" />
    };

    const bgColors = {
        success: 'bg-zuno-card border-green-500/20',
        error: 'bg-zuno-card border-red-500/20',
        info: 'bg-zuno-card border-blue-500/20',
        loading: 'bg-zuno-card border-zuno-accent/20'
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                } ${bgColors[type]}`}
        >
            {icons[type]}
            <p className="text-sm font-medium text-white">{message}</p>
        </div>,
        document.body
    );
};

// Simple Event Bus for Toast
type ToastEvent = { message: string, type: ToastType, duration?: number, id: string };
const listeners = new Set<(toast: ToastEvent | null) => void>();

export const toast = {
    show: (message: string, type: ToastType = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        listeners.forEach(l => l({ message, type, duration, id }));
        return id;
    },
    dismiss: (id: string) => {
        // In a more complex system we'd filter, but for now we essentially rely on auto-dismiss or replacement
    }
};

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastEvent[]>([]);

    useEffect(() => {
        const handler = (event: ToastEvent | null) => {
            if (event) {
                setToasts(prev => [...prev, event]);
            }
        };
        listeners.add(handler);
        return () => { listeners.delete(handler); };
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <>
            {toasts.map(t => (
                <Toast
                    key={t.id}
                    message={t.message}
                    type={t.type}
                    duration={t.duration}
                    onClose={() => removeToast(t.id)}
                />
            ))}
        </>
    );
};
