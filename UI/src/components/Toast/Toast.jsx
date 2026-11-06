import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast } from '../../store/features/common';
import { CheckCircleIcon } from '../common/Icons';

const Toast = () => {
  const toast = useSelector((state) => state?.commonState?.toast);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => dispatch(hideToast()), 2500);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  if (!toast) return null;

  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-raised px-5 py-3 text-sm font-semibold shadow-2xl shadow-black/50">
        <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
        {toast.message}
      </div>
    </div>
  );
};

export default Toast;
