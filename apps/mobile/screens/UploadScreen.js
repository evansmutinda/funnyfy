import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import UploadFlowHeader, { getUploadQuotaInfo } from '../components/UploadFlowHeader';
import ComparisonFade from '../components/ComparisonFade';
import PhotoTipsSheet from '../components/PhotoTipsSheet';
import useImagePicker from '../hooks/useImagePicker';
import { getComparisonPair } from '../data/comparisonPairs';
import { getStylePhotoTips } from '../data/stylePhotoTips';
import { isPhotoTipsDismissed, setPhotoTipsDismissed } from '../utils/photoTipsPrefs';
import styles from '../styles';

/**
 * Pre-pick upload screen. Shows the chosen style as a looping
 * before/after comparison so the user can preview what they're
 * about to apply, then provides Gallery / Camera entry points.
 *
 * Gallery / Camera open the picker, then integrated uCrop on native builds
 * (full photo selected by default). Then `onPicked`.
 */
export default function UploadScreen({
  style,
  onPicked,
  onBackToStyle,
  subscriptionInfo,
  onSubscribe,
  onOpenUsage,
}) {
  const insets = useSafeAreaInsets();
  const { pickImage, picking, pickingSource } = useImagePicker();
  const [tipsVisible, setTipsVisible] = useState(false);
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

  const getQuotaInfo = () => getUploadQuotaInfo(subscriptionInfo);

  const quotaInfo = getQuotaInfo();
  const hasPlan = Boolean(subscriptionInfo?.subscription);
  const needsSubscription = Boolean(subscriptionInfo) && !hasPlan;
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

      {/* Comparison background — looping before/after, including stickers */}
      <ComparisonFade
        key={style?.id || 'upload-comparison'}
        instanceKey={style?.id || 'upload-comparison'}
        beforeSource={comparisonPair.before}
        afterSource={comparisonPair.after}
        afterSources={comparisonPair.afters}
        style={styles.uploadBackgroundFill}
        imageStyle={styles.uploadBackgroundImage}
        holdMs={1800}
        fadeMs={1000}
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

      {/* Bottom photo source options */}
      <View style={[styles.uploadBottomLayer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.uploadSourceBlock}>
          <UploadSourceOption
            icon="folder"
            title="Photo library"
            subtitle="Pick from your albums"
            loading={picking && pickingSource === 'gallery'}
            onPress={() => handlePick(false)}
            disabled={picking}
          />
          <UploadSourceOption
            icon="camera"
            title="Camera"
            subtitle="Take a photo"
            loading={picking && pickingSource === 'camera'}
            onPress={() => handlePick(true)}
            disabled={picking}
          />
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

function UploadSourceOption({
  icon,
  title,
  subtitle,
  loading = false,
  onPress,
  disabled,
}) {
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.uploadSourceOption,
        disabled && styles.uploadSourceOptionDisabled,
      ]}
    >
      <View style={styles.uploadCircleButton}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Feather name={icon} size={20} color="#FFFFFF" />
        )}
      </View>
      <View style={styles.uploadSourceOptionText}>
        <Text style={styles.uploadSourceOptionTitle}>{title}</Text>
        <Text style={styles.uploadSourceOptionSubtitle} numberOfLines={1}>
          {loading ? 'Opening…' : subtitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.45)" />
    </PressScale>
  );
}
