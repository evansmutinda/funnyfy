import React, { useCallback, useMemo, useState } from 'react';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

export const NotificationContext = React.createContext({
  showToast: () => {},
  showDialog: () => {},
});

export function useNotifications() {
  return React.useContext(NotificationContext);
}

export default function NotificationProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, title: '', message: '', type: 'info' });
  const [dialog, setDialog] = useState({ visible: false });

  const showToast = useCallback((title, message, type = 'info') => {
    setToast({ visible: true, title: title || '', message: message || '', type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }));
  }, []);

  const showDialog = useCallback((opts) => {
    setDialog({ visible: true, ...opts });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog((d) => ({ ...d, visible: false }));
  }, []);

  const value = useMemo(
    () => ({ showToast, showDialog, closeDialog }),
    [showToast, showDialog, closeDialog]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      <ConfirmDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        cancelLabel={dialog.cancelLabel}
        neutralLabel={dialog.neutralLabel}
        neutralDestructive={dialog.neutralDestructive}
        confirmLabel={dialog.confirmLabel}
        destructive={dialog.destructive}
        onCancel={() => {
          if (dialog.onCancel) dialog.onCancel();
          closeDialog();
        }}
        onNeutral={() => {
          if (dialog.onNeutral) dialog.onNeutral();
        }}
        onConfirm={() => {
          if (dialog.onConfirm) dialog.onConfirm();
        }}
      />
    </NotificationContext.Provider>
  );
}
