import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import PressScale from './PressScale';
import styles from '../styles';

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  neutralLabel = null,
  checkboxLabel = null,
  destructive = false,
  neutralDestructive = false,
  hideCancel = false,
  stackActions = false,
  onConfirm,
  onCancel,
  onNeutral,
}) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (visible) setChecked(false);
  }, [visible]);

  const handleBackdropPress = () => {
    if (hideCancel) return;
    onCancel?.();
  };

  const handleRequestClose = () => {
    if (hideCancel) return;
    onCancel?.();
  };

  const handleConfirm = () => {
    onConfirm?.(checkboxLabel ? checked : undefined);
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
          {checkboxLabel ? (
            <Pressable
              style={styles.dialogCheckboxRow}
              onPress={() => setChecked((value) => !value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
            >
              <Feather
                name={checked ? 'check-square' : 'square'}
                size={20}
                color={checked ? '#A5B4FC' : '#9CA3AF'}
              />
              <Text style={styles.dialogCheckboxLabel}>{checkboxLabel}</Text>
            </Pressable>
          ) : null}
          <View style={[
            styles.dialogActionsRow,
            (hideCancel || stackActions) && styles.dialogActionsStack,
          ]}>
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
              onPress={handleConfirm}
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
