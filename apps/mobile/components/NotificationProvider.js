import React, { useCallback, useMemo, useState } from 'react';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

export const NotificationContext = React.createContext({
  showToast: () => {},
  showDialog: () => {},
  closeDialog: () => {},
});

export function useNotifications() {
  return React.useContext(NotificationContext);
}

const EMPTY_TOAST = {
  visible: false,
  title: '',
  message: '',
  type: 'info',
  actionLabel: null,
  onAction: null,
};

export default function NotificationProvider({ children }) {
  const [toast, setToast] = useState(EMPTY_TOAST);
  const [dialog, setDialog] = useState({ visible: false });

  const showToast = useCallback((title, message, type = 'info', options = {}) => {
    setToast({
      visible: true,
      title: title || '',
      message: message || '',
      type,
      actionLabel: options.actionLabel || null,
      onAction: options.onAction || null,
    });
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
        actionLabel={toast.actionLabel}
        onAction={toast.onAction}
        onHide={hideToast}
      />
      <ConfirmDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        cancelLabel={dialog.cancelLabel}
        neutralLabel={dialog.neutralLabel}
        neutralDestructive={dialog.neutralDestructive}
        checkboxLabel={dialog.checkboxLabel}
        confirmLabel={dialog.confirmLabel}
        destructive={dialog.destructive}
        hideCancel={dialog.hideCancel}
        stackActions={dialog.stackActions}
        onCancel={() => {
          if (dialog.onCancel) dialog.onCancel();
          closeDialog();
        }}
        onNeutral={() => {
          if (dialog.onNeutral) dialog.onNeutral();
        }}
        onConfirm={(checked) => {
          if (dialog.onConfirm) dialog.onConfirm(checked);
        }}
      />
    </NotificationContext.Provider>
  );
}
