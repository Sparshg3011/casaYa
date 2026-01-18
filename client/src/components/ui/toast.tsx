'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: number;
  title?: string;
  description: string;
  variant: 'default' | 'destructive' | 'success';
}

interface ToastContextType {
  toast: (options: { title?: string; description: string; variant?: 'default' | 'destructive' | 'success' }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: { 
    title?: string; 
    description: string; 
    variant?: 'default' | 'destructive' | 'success' 
  }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(({ id, title, description, variant }) => (
          <div
            key={id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white ${
              variant === 'success' ? 'bg-green-500' :
              variant === 'destructive' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
          >
            {title && <div className="font-semibold">{title}</div>}
            <div>{description}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 