import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
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
