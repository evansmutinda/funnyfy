import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, Animated, Modal, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

// Context
const NotificationContext = createContext({
  showToast: () => {},
  showDialog: () => {},
  closeDialog: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

// Custom animated Toast component
function Toast({ visible, title, message, type = 'info', onHide }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 220,
          useNativeDriver: true,
        }).start(() => onHide && onHide());
      }, 2800);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-100);
    }
  }, [visible]);

  if (!visible) return null;

  const accent = type === 'success' ? '#10B981'
    : type === 'error' ? '#F59E0B'
    : type === 'warning' ? '#F59E0B'
    : '#0F172A';

  const icon = type === 'success' ? '✓'
    : type === 'error' ? '!'
    : type === 'warning' ? '!'
    : 'i';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastContainer,
        { paddingTop: insets.top + 8, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.toastInner}>
        <View style={[styles.toastIconCircle, { backgroundColor: accent }]}>
          <Text style={styles.toastIconText}>{icon}</Text>
        </View>
        <View style={styles.toastTextWrap}>
          {title ? <Text style={styles.toastTitle}>{title}</Text> : null}
          {message ? <Text style={styles.toastMessage}>{message}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
}

// Custom Modal-based confirmation dialog component
function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  neutralLabel = null,
  destructive = false,
  neutralDestructive = false,
  onConfirm,
  onCancel,
  onNeutral,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.dialogBackdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={styles.dialogCard} onStartShouldSetResponder={() => true}>
          {title ? <Text style={styles.dialogTitle}>{title}</Text> : null}
          {message ? <Text style={styles.dialogMessage}>{message}</Text> : null}
          <View style={styles.dialogActionsRow}>
            <TouchableOpacity style={styles.dialogCancelButton} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            {neutralLabel ? (
              <TouchableOpacity
                style={[styles.dialogNeutralButton, neutralDestructive && styles.dialogNeutralDestructive]}
                onPress={onNeutral}
              >
                <Text style={[styles.dialogNeutralText, neutralDestructive && styles.dialogNeutralTextDestructive]}>
                  {neutralLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.dialogConfirmButton, destructive && styles.dialogConfirmDestructive]}
              onPress={onConfirm}
            >
              <Text style={[styles.dialogConfirmText, destructive && styles.dialogConfirmTextDestructive]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Provider wrapper
export function NotificationProvider({ children }) {
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
