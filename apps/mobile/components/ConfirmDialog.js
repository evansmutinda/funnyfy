import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import PressScale from './PressScale';
import styles from '../styles';

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  neutralLabel = null,
  destructive = false,
  neutralDestructive = false,
  hideCancel = false,
  onConfirm,
  onCancel,
  onNeutral,
}) {
  const handleBackdropPress = () => {
    if (hideCancel) return;
    onCancel?.();
  };

  const handleRequestClose = () => {
    if (hideCancel) return;
    onCancel?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleRequestClose}
    >
      <TouchableOpacity
        style={styles.dialogBackdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <View style={styles.dialogCard} onStartShouldSetResponder={() => true}>
          {title ? <Text style={styles.dialogTitle}>{title}</Text> : null}
          {message ? <Text style={styles.dialogMessage}>{message}</Text> : null}
          <View style={[styles.dialogActionsRow, hideCancel && styles.dialogActionsStack]}>
            {!hideCancel ? (
              <PressScale style={styles.dialogCancelButton} onPress={onCancel}>
                <Text style={styles.dialogCancelText}>{cancelLabel}</Text>
              </PressScale>
            ) : null}
            {neutralLabel ? (
              <PressScale
                style={[styles.dialogNeutralButton, neutralDestructive && styles.dialogNeutralDestructive]}
                onPress={onNeutral}
              >
                <Text style={[styles.dialogNeutralText, neutralDestructive && styles.dialogNeutralTextDestructive]}>
                  {neutralLabel}
                </Text>
              </PressScale>
            ) : null}
            <PressScale
              style={[
                styles.dialogConfirmButton,
                hideCancel && styles.dialogConfirmButtonFull,
                destructive && styles.dialogConfirmDestructive,
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.dialogConfirmText, destructive && styles.dialogConfirmTextDestructive]}>
                {confirmLabel}
              </Text>
            </PressScale>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
