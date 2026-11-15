import React from 'react';
import { ToastType } from '../../types';

export interface ToastData {
  msg: string;
  type?: ToastType;
}

interface ToastProps {
  toast: ToastData | null;
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const bg = isSuccess ? '#166534' : isError ? '#7f1d1d' : '#1e293b';

  return (
    <div className="toast-container" style={{ background: bg }}>
      {toast.msg}
    </div>
  );
}
