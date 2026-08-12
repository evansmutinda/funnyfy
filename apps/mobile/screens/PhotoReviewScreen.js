import React from 'react';
import {
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../components/NotificationProvider';
import PressScale from '../components/PressScale';
import UploadFlowHeader, { getUploadQuotaInfo } from '../components/UploadFlowHeader';
import useImagePicker from '../hooks/useImagePicker';
import { isTrialUser, getTrialRemaining } from '../utils/trialWarnings';
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
  const insets = useSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const { pickImage, picking } = useImagePicker();

  const getQuotaInfo = () => getUploadQuotaInfo(subscriptionInfo);

  const quotaInfo = getQuotaInfo();
  const trialRemaining = isTrialUser(subscriptionInfo) ? getTrialRemaining(subscriptionInfo) : null;
  const quotaOk = canGenerateMore !== false;
  const canGenerate = !!imageUri && !picking && !isGenerating && quotaOk && isOnline;

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
    if (!quotaOk && onSubscribe) {
      showDialog({
        title: 'Quota Exceeded',
        message: `You've used all ${quotaInfo.limit} caricatures this month. Upgrade your plan to continue.`,
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={[styles.reviewHeaderBand, { paddingTop: insets.top + 8 }]}>
        <UploadFlowHeader
          onBack={onBack}
          onStylePress={onBack}
          style={style}
          subscriptionInfo={subscriptionInfo}
          onOpenUsage={onOpenUsage}
        />

        {quotaInfo.isExceeded ? (
          <TouchableOpacity onPress={onSubscribe} style={styles.uploadInlineBanner}>
            <Feather name="alert-circle" size={14} color="#FCA5A5" />
            <Text style={styles.uploadInlineBannerText}>
              Quota reached — tap to upgrade
            </Text>
          </TouchableOpacity>
        ) : trialRemaining === 1 ? (
          <TouchableOpacity onPress={onSubscribe} style={styles.uploadInlineBanner}>
            <Feather name="alert-circle" size={14} color="#FCD34D" />
            <Text style={styles.uploadInlineBannerText}>
              1 caricature left on your trial — tap to upgrade
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
        <View style={styles.uploadInlineActionsRow}>
          <PressScale
            onPress={handleChooseAnother}
            style={styles.uploadSmallGhostButton}
            disabled={picking}
          >
            <Feather name="refresh-ccw" size={14} color="#FFFFFF" />
            <Text style={styles.uploadSmallGhostButtonText}>Choose another</Text>
          </PressScale>
        </View>

        <PressScale
          onPress={handleGenerate}
          disabled={!canGenerate || picking}
          style={[
            styles.uploadGenerateButton,
            (!canGenerate || picking) && styles.uploadGenerateButtonDisabled,
          ]}
        >
          <Text style={styles.uploadGenerateButtonText}>
            {!isOnline
              ? 'No internet connection'
              : isGenerating
                ? 'Generation in progress…'
              : quotaOk
                ? 'Generate'
                : 'Upgrade to continue'}
          </Text>
        </PressScale>
      </View>
    </View>
  );
}
