import React, { useCallback, useMemo, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
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
  const [dialog, setDialog] = useState({ visible: false, presentationId: 0 });
  const presentationIdRef = useRef(0);
  const presentTimerRef = useRef(null);

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

  const closeDialog = useCallback(() => {
    if (presentTimerRef.current) {
      clearTimeout(presentTimerRef.current);
      presentTimerRef.current = null;
    }
    setDialog((d) => ({ ...d, visible: false }));
  }, []);

  const showDialog = useCallback((opts) => {
    // Don't stack a leftover top toast under/over the dialog.
    setToast((t) => (t.visible ? { ...t, visible: false } : t));

    // Force a fresh Modal present. On Android, showing a dialog in the same
    // frame as heavy ResultScreen loading transitions can swallow the first Modal.
    if (presentTimerRef.current) {
      clearTimeout(presentTimerRef.current);
      presentTimerRef.current = null;
    }

    presentationIdRef.current += 1;
    const presentationId = presentationIdRef.current;
    setDialog({ visible: false, presentationId });

    const present = () => {
      presentTimerRef.current = null;
      setDialog({ visible: true, presentationId, ...opts });
    };

    InteractionManager.runAfterInteractions(() => {
      presentTimerRef.current = setTimeout(present, 40);
    });
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
        key={dialog.presentationId || 0}
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
          else closeDialog();
        }}
        onNeutral={() => {
          if (dialog.onNeutral) dialog.onNeutral();
        }}
        onConfirm={(checked) => {
          if (dialog.onConfirm) dialog.onConfirm(checked);
          else closeDialog();
        }}
      />
    </NotificationContext.Provider>
  );
}
