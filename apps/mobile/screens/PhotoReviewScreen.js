import React, { useState } from 'react';
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
import PhotoTipsSheet from '../components/PhotoTipsSheet';
import useImagePicker from '../hooks/useImagePicker';
import { isTrialUser, getTrialRemaining } from '../utils/trialWarnings';
import styles from '../styles';

/**
 * Post-pick review of a photo. Solid dark surface (no comparison
 * fade), with a header band, a flex-grown middle that centers the
 * picked photo, and a bottom action band — so the preview card is
 * always symmetric within the space between header and actions
 * regardless of safe-area insets.
 *
 * Reuses upload* styles for visual parity with UploadScreen.
 */
export default function PhotoReviewScreen({
  style,
  imageUri,
  imageDataUrl,
  isOnline = true,
  subscriptionInfo,
  canGenerateMore,
  onStart,
  onSubscribe,
  onOpenSubscription,
  onReplacePhoto,
  onBack,
}) {
  const insets = useSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const { pickImage, picking } = useImagePicker();
  const [tipsVisible, setTipsVisible] = useState(false);

  const getQuotaInfo = () => {
    if (!subscriptionInfo || !subscriptionInfo.usage) {
      return { current: 0, limit: 3, percentage: 0, isLow: false, isExceeded: false };
    }
    const { current, limit } = subscriptionInfo.usage;
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    return {
      current,
      limit,
      percentage,
      isLow: percentage >= 80 && percentage < 100,
      isExceeded: percentage >= 100,
    };
  };

  const quotaInfo = getQuotaInfo();
  const trialRemaining = isTrialUser(subscriptionInfo) ? getTrialRemaining(subscriptionInfo) : null;
  const quotaOk = canGenerateMore !== false;
  const canGenerate = !!imageUri && !picking && quotaOk && isOnline;

  const handleChooseAnother = async () => {
    const next = await pickImage(false);
    if (next && onReplacePhoto) {
      onReplacePhoto(next);
    }
  };

  const handleGenerate = () => {
    if (!isOnline) {
      showToast(
        'No connection',
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

      {/* Header band — natural flow at top */}
      <View style={[styles.reviewHeaderBand, { paddingTop: insets.top + 8 }]}>
        <View style={styles.uploadHeaderRow}>
          <PressScale onPress={onBack} style={styles.uploadCircleButton}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </PressScale>

          {subscriptionInfo ? (
            <PressScale
              onPress={onOpenSubscription}
              style={styles.uploadHeaderPill}
              disabled={!onOpenSubscription}
            >
              <View style={styles.uploadHeaderPillProgress}>
                <View
                  style={[
                    styles.uploadHeaderPillProgressFill,
                    { width: `${Math.min(quotaInfo.percentage, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.uploadHeaderPillText}>
                {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                  ? `Trial · ${quotaInfo.current}/${quotaInfo.limit}`
                  : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} · ${quotaInfo.current}/${quotaInfo.limit}`}
              </Text>
            </PressScale>
          ) : (
            <View style={{ width: 40 }} />
          )}

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.uploadFloatingChipRow}>
          {style ? (
            <PressScale onPress={onBack} style={styles.uploadFloatingChip}>
              <View style={styles.uploadFloatingChipDot} />
              <Text style={styles.uploadFloatingChipText} numberOfLines={1}>
                {style.label}
              </Text>
              <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.85)" />
            </PressScale>
          ) : null}

          <PressScale
            onPress={() => setTipsVisible(true)}
            style={styles.uploadFloatingChip}
            hitSlop={6}
          >
            <Feather name="info" size={14} color="#FFFFFF" />
            <Text style={styles.uploadFloatingChipText}>Photo tips</Text>
          </PressScale>
        </View>

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
        ) : !isOnline ? (
          <View style={styles.uploadInlineBanner}>
            <Feather name="wifi-off" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.uploadInlineBannerText}>
              You&apos;re offline — connect to generate
            </Text>
          </View>
        ) : null}
      </View>

      {/* Centered preview — flex-grows to fill the gap between bands */}
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

      {/* Action band — natural flow at bottom */}
      <View style={[styles.reviewActionBand, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.uploadInlineActionsRow}>
          <PressScale
            onPress={onBack}
            style={styles.uploadSmallGhostButton}
            disabled={picking}
          >
            <Feather name="x" size={14} color="#FFFFFF" />
            <Text style={styles.uploadSmallGhostButtonText}>Remove</Text>
          </PressScale>
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
              : quotaOk
                ? 'Generate'
                : 'Upgrade to continue'}
          </Text>
        </PressScale>
      </View>

      <PhotoTipsSheet
        visible={tipsVisible}
        onClose={() => setTipsVisible(false)}
      />
    </View>
  );
}
