import React from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNotifications } from '../components/NotificationProvider';
import PressScale from '../components/PressScale';
import UploadFlowHeader, { getUploadQuotaInfo } from '../components/UploadFlowHeader';
import useImagePicker from '../hooks/useImagePicker';
import useStableSafeAreaInsets from '../hooks/useStableSafeAreaInsets';
import styles from '../styles';

/**
 * Post-pick review of a photo. Crop happens during pick (uCrop on native builds).
 */
export default function PhotoReviewScreen({
  style,
  imageUri,
  imageDataUrl,
  isOnline = true,
  isGenerating = false,
  subscriptionInfo,
  canGenerateMore,
  onStart,
  onSubscribe,
  onOpenUsage,
  onReplacePhoto,
  onBack,
}) {
  const insets = useStableSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const { pickImage, picking } = useImagePicker();

  const getQuotaInfo = () => getUploadQuotaInfo(subscriptionInfo);

  const quotaInfo = getQuotaInfo();
  const hasPlan = Boolean(subscriptionInfo?.subscription);
  const needsSubscription = Boolean(subscriptionInfo) && !hasPlan;
  const quotaOk = canGenerateMore !== false;
  // Blocked users keep a tappable button so the press can open the paywall.
  const canGenerate = !!imageUri && !picking && !isGenerating && isOnline;

  const handleChooseAnother = async () => {
    const next = await pickImage(false);
    if (next && onReplacePhoto) {
      onReplacePhoto(next);
    }
  };

  const handleGenerate = () => {
    if (!isOnline) {
      showToast(
        'Check your internet connectivity',
        'Connect to the internet to generate caricatures.',
        'warning',
      );
      return;
    }
    if (needsSubscription && onSubscribe) {
      onSubscribe();
      return;
    }
    if (!quotaOk && onSubscribe) {
      showDialog({
        title: 'Quota Exceeded',
        message: `You've used all ${quotaInfo.limit} images this month. Upgrade your plan to continue.`,
        cancelLabel: 'Cancel',
        confirmLabel: 'Upgrade',
        onCancel: closeDialog,
        onConfirm: () => {
          closeDialog();
          onSubscribe();
        },
      });
      return;
    }
    onStart({ imageUri, imageDataUrl });
  };

  return (
    <View style={styles.reviewRoot}>
      <View style={[styles.reviewHeaderBand, { paddingTop: insets.top + 8 }]}>
        <UploadFlowHeader
          onBack={onBack}
          onStylePress={onBack}
          style={style}
          subscriptionInfo={subscriptionInfo}
          onOpenUsage={onOpenUsage}
        />

        {needsSubscription ? (
          <TouchableOpacity onPress={onSubscribe} style={styles.uploadInlineBanner}>
            <Feather name="lock" size={14} color="#FCD34D" />
            <Text style={styles.uploadInlineBannerText}>
              Subscription required — tap to subscribe
            </Text>
          </TouchableOpacity>
        ) : quotaInfo.isExceeded ? (
          <TouchableOpacity onPress={onSubscribe} style={styles.uploadInlineBanner}>
            <Feather name="alert-circle" size={14} color="#FCA5A5" />
            <Text style={styles.uploadInlineBannerText}>
              Quota reached — tap to upgrade
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.reviewPreviewBand}>
        <View style={styles.reviewPreviewCard}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.reviewPreviewImage}
            />
          ) : null}
        </View>
      </View>

      <View style={[styles.reviewActionBand, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.uploadReviewActionsRow}>
          <PressScale
            onPress={handleChooseAnother}
            style={styles.uploadSmallGhostButton}
            disabled={picking}
          >
            <Feather name="refresh-ccw" size={14} color="#FFFFFF" />
            <Text style={styles.uploadSmallGhostButtonText} numberOfLines={1}>Choose another</Text>
          </PressScale>
          <PressScale
            onPress={handleGenerate}
            disabled={!canGenerate || picking}
            style={[
              styles.uploadGenerateButton,
              styles.uploadGenerateButtonInRow,
              (!canGenerate || picking) && styles.uploadGenerateButtonDisabled,
            ]}
          >
            <Text style={styles.uploadGenerateButtonText} numberOfLines={1}>
              {!isOnline
                ? 'No internet connection'
                : isGenerating
                  ? 'Generation in progress…'
                : needsSubscription
                  ? 'Subscribe to generate'
                : quotaOk
                  ? 'Generate'
                  : 'Upgrade to continue'}
            </Text>
          </PressScale>
        </View>
      </View>
    </View>
  );
}
