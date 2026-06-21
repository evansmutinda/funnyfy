import React, { useEffect, useRef, useState } from 'react';
import {
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../components/NotificationProvider';
import PressScale from '../components/PressScale';
import UploadFlowHeader, { getUploadQuotaInfo } from '../components/UploadFlowHeader';
import ComparisonFade from '../components/ComparisonFade';
import PhotoTipsSheet from '../components/PhotoTipsSheet';
import useImagePicker from '../hooks/useImagePicker';
import { getComparisonPair } from '../data/comparisonPairs';
import { getStylePhotoTips } from '../data/stylePhotoTips';
import { getTrialRemaining, getTrialWarningMessage, isTrialUser } from '../utils/trialWarnings';
import { isPhotoTipsDismissed, setPhotoTipsDismissed } from '../utils/photoTipsPrefs';
import styles from '../styles';

/**
 * Pre-pick upload screen. Shows the chosen style as a looping
 * before/after comparison so the user can preview what they're
 * about to apply, then provides Gallery / Camera entry points.
 *
 * Gallery / Camera open the OS picker + crop, then `onPicked`.
 */
export default function UploadScreen({
  style,
  onPicked,
  onBackToStyle,
  canGenerateMore,
  subscriptionInfo,
  onSubscribe,
  onOpenSubscription,
}) {
  const insets = useSafeAreaInsets();
  const { showToast } = useNotifications();
  const { pickImage, picking, pickingSource } = useImagePicker();
  const [tipsVisible, setTipsVisible] = useState(false);
  const trialWarnedRef = useRef(false);
  const styleTips = getStylePhotoTips(style?.id);

  useEffect(() => {
    if (!style?.id || !styleTips) return undefined;

    let cancelled = false;
    (async () => {
      const dismissed = await isPhotoTipsDismissed(style.id);
      if (!cancelled && !dismissed) {
        setTipsVisible(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [style?.id, styleTips]);

  useEffect(() => {
    if (trialWarnedRef.current || !subscriptionInfo) return;
    if (!isTrialUser(subscriptionInfo)) return;
    const remaining = getTrialRemaining(subscriptionInfo);
    const message = getTrialWarningMessage(remaining);
    if (!message) return;
    trialWarnedRef.current = true;
    showToast('Trial', message, remaining === 1 ? 'warning' : 'info', {
      actionLabel: remaining === 1 ? 'Upgrade' : undefined,
      onAction: remaining === 1 ? onSubscribe : undefined,
    });
  }, [subscriptionInfo]);

  const getQuotaInfo = () => getUploadQuotaInfo(subscriptionInfo);

  const quotaInfo = getQuotaInfo();
  const trialRemaining = isTrialUser(subscriptionInfo) ? getTrialRemaining(subscriptionInfo) : null;
  const comparisonPair = getComparisonPair(style);

  const handlePick = async (useCamera) => {
    const picked = await pickImage(useCamera);
    if (picked && onPicked) {
      onPicked(picked);
    }
  };

  const handleTipsClose = async ({ dontShowAgain } = {}) => {
    setTipsVisible(false);
    if (dontShowAgain && style?.id) {
      await setPhotoTipsDismissed(style.id, true);
    }
  };

  return (
    <View style={styles.uploadRoot}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Comparison background — looping before/after for the selected style */}
      <ComparisonFade
        beforeSource={comparisonPair.before}
        afterSource={comparisonPair.after}
        style={styles.uploadBackgroundFill}
        imageStyle={styles.uploadBackgroundImage}
      />

      {/* Top scrim — improves legibility of header chips */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0)']}
        locations={[0, 0.6, 1]}
        style={[styles.uploadScrimTop, { height: 180 + insets.top }]}
      />

      {/* Bottom scrim — improves legibility of action cards */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.45, 1]}
        style={styles.uploadScrimBottom}
      />

      {/* Header */}
      <View style={[styles.uploadTopLayer, { paddingTop: insets.top + 8 }]}>
        <UploadFlowHeader
          onBack={onBackToStyle}
          onStylePress={onBackToStyle}
          style={style}
          subscriptionInfo={subscriptionInfo}
          onOpenSubscription={onOpenSubscription}
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

      {/* Bottom action cards */}
      <View style={[styles.uploadBottomLayer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.uploadActionStack}>
          <View style={styles.uploadActionCardRow}>
            <ActionCard
              icon="image"
              title="Gallery"
              description="Pick and crop from your library"
              ctaLabel={
                picking && pickingSource === 'gallery' ? 'Opening…' : 'Select Photo'
              }
              onPress={() => handlePick(false)}
              disabled={picking}
            />
            <ActionCard
              icon="camera"
              title="Camera"
              description="Take a photo, then crop it"
              ctaLabel={
                picking && pickingSource === 'camera' ? 'Opening…' : 'Take Photo'
              }
              onPress={() => handlePick(true)}
              disabled={picking}
            />
          </View>
        </View>
      </View>

      <PhotoTipsSheet
        visible={tipsVisible}
        onClose={handleTipsClose}
        styleLabel={style?.label}
        tips={styleTips}
      />
    </View>
  );
}

function ActionCard({ icon, title, description, ctaLabel, onPress, disabled }) {
  return (
    <View style={styles.uploadActionCard}>
      <View style={styles.uploadActionCardIcon}>
        <Feather name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.uploadActionCardTitle}>{title}</Text>
      <Text style={styles.uploadActionCardDescription} numberOfLines={2}>
        {description}
      </Text>
      <PressScale
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.uploadActionCardCta,
          disabled && styles.uploadActionCardCtaDisabled,
        ]}
      >
        <Text style={styles.uploadActionCardCtaText}>{ctaLabel}</Text>
      </PressScale>
    </View>
  );
}
