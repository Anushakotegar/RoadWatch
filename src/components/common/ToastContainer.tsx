import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg shadow-lg border text-xs max-w-sm animate-in slide-in-from-right-4 ${
              isSuccess
                ? 'bg-white border-emerald-300 text-slate-800'
                : isError
                ? 'bg-white border-red-300 text-slate-800'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {isError && <AlertTriangle className="w-4 h-4 text-red-600" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-teal-400" />}
            </div>

            <div className="flex-1 font-medium leading-snug">
              {toast.message}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
