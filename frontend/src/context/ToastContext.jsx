import { createContext, useState } from 'react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 border-4 border-black p-4 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transition-all ${
          toast.type === 'error' ? 'bg-red-500 text-white' :
          toast.type === 'success' ? 'bg-green-400 text-black' :
          'bg-black text-white'
        }`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'success' ? '✓' : 'ℹ'}</span>
          <p className="text-sm uppercase tracking-wide">{toast.message}</p>
        </div>
      )}
    </ToastContext.Provider>
  );
};