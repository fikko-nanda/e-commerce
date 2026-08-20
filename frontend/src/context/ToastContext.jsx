import { createContext, useState, useContext } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-bounce">
          <div className={`p-4 border-4 border-black font-black text-xs uppercase shadow-brutal flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-400 text-black' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-yellow-300 text-black'
          }`}>
            <span className="text-base">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '🚨' : '🔔'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);