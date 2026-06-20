import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Platform,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import { useNotifications } from '../components/NotificationProvider';
import PressScale from '../components/PressScale';
import { saveToGallery } from './GalleryScreen';
import {
  FUNNYFY_FOLDER_NAME,
  getSavedImageFileName,
  saveToFunnyfyAlbum,
} from '../constants';
import {
  getJobProgressCopy,
  JOB_PROGRESS_PHASE_COUNT,
} from '../utils/jobProgress';
import styles from '../styles';

export function getImageUrlFromOutput(output) {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.length > 0) {
    return typeof output[0] === 'string' ? output[0] : output[0]?.url || null;
  }
  if (typeof output === 'object') {
    return output.url || output.outputImageUrl || output.output_image_url || null;
  }
  return null;
}

export default function ResultScreen({
  original,
  result,
  loading,
  job = null,
  error,
  failedAttempts = 0,
  onRetry,
  onBack,
  onHome,
  onOpenGallery,
  onTryAnotherStyle,
  subscriptionInfo,
  backHandlerRef,
  style,
}) {
  const insets = useSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const imageUrl = result ? getImageUrlFromOutput(result.output) : null;
  const [mix, setMix] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [localPreviewUri, setLocalPreviewUri] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [progressTick, setProgressTick] = useState(0);
  const sliderDemoDoneRef = useRef(false);
  const sliderUserTouchedRef = useRef(false);
  const hasResult = !!result && !!imageUrl;
  const maxRetriesReached = error && failedAttempts >= 3;
  const displayUri = localPreviewUri || imageUrl;
  const showCompare = hasResult && !loading && !!displayUri && !previewError;
  const showLoadingOverlay = (loading && !hasResult) || (hasResult && !displayUri && !previewError);

  const progressCopy = useMemo(
    () => getJobProgressCopy(job, {
      styleLabel: style?.label,
      loading: loading && !hasResult,
      now: Date.now(),
    }),
    [job, style?.label, loading, hasResult, progressTick],
  );

  useEffect(() => {
    if (!loading || hasResult || job?.status !== 'processing') return undefined;
    const id = setInterval(() => setProgressTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [loading, hasResult, job?.status]);
  const resultQuotaCurrent = subscriptionInfo?.usage?.current ?? 0;
  const resultQuotaLimit = subscriptionInfo?.usage?.limit ?? 3;
  const resultQuotaPct = resultQuotaLimit > 0
    ? Math.min(100, (resultQuotaCurrent / resultQuotaLimit) * 100)
    : 0;

  useEffect(() => {
    if (hasResult) {
      setMix(0);
      setHasBeenSaved(false);
      setPreviewError(false);
      sliderDemoDoneRef.current = false;
      sliderUserTouchedRef.current = false;
    }
  }, [hasResult, imageUrl]);

  // Cache the remote result locally so Android reliably renders the preview.
  useEffect(() => {
    let cancelled = false;

    if (!imageUrl) {
      setLocalPreviewUri(null);
      setPreviewError(false);
      return undefined;
    }

    setLocalPreviewUri(null);
    setPreviewError(false);

    (async () => {
      try {
        const path = `${FileSystem.cacheDirectory}result_preview_${Date.now()}.jpg`;
        const dl = await FileSystem.downloadAsync(imageUrl, path);
        if (cancelled) return;
        if (dl.status === 200) {
          setLocalPreviewUri(dl.uri);
        } else {
          setLocalPreviewUri(imageUrl);
        }
      } catch (err) {
        console.warn('[Result] preview cache failed, using remote URL:', err);
        if (!cancelled) {
          setLocalPreviewUri(imageUrl);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const showSavedToast = useCallback((savedPath) => {
    showToast('Saved', savedPath, 'success', {
      actionLabel: 'View in Gallery',
      onAction: () => onOpenGallery?.(),
    });
  }, [onOpenGallery, showToast]);

  useEffect(() => {
    if (!showCompare || canvasWidth <= 0 || sliderDemoDoneRef.current) return undefined;

    let frameId = null;
    let cancelled = false;
    const delayMs = 600;
    const sweepMs = 1400;
    const pauseMs = 400;
    const returnMs = 1200;

    const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

    const timeoutId = setTimeout(() => {
      if (cancelled || sliderUserTouchedRef.current) return;

      const start = Date.now();
      const totalMs = sweepMs + pauseMs + returnMs;

      const tick = () => {
        if (cancelled || sliderUserTouchedRef.current) return;

        const elapsed = Date.now() - start;
        if (elapsed >= totalMs) {
          setMix(0);
          sliderDemoDoneRef.current = true;
          return;
        }

        let nextMix = 0;
        if (elapsed < sweepMs) {
          nextMix = easeInOut(elapsed / sweepMs);
        } else if (elapsed < sweepMs + pauseMs) {
          nextMix = 1;
        } else {
          const t = (elapsed - sweepMs - pauseMs) / returnMs;
          nextMix = 1 - easeInOut(t);
        }

        setMix(nextMix);
        frameId = requestAnimationFrame(tick);
      };

      frameId = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, [showCompare, canvasWidth, imageUrl]);

  const handleShare = async () => {
    if (!imageUrl || loading) return;
    try {
      const fileName = getSavedImageFileName();
      const localPath = FileSystem.documentDirectory + fileName;
      const resultDl = await FileSystem.downloadAsync(imageUrl, localPath);
      await Sharing.shareAsync(resultDl.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Check out my caricature!',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleDownload = async (opts = {}) => {
    const { silent = false } = opts;
    if (!imageUrl || loading) return false;
    try {
      let localPath = localPreviewUri;

      if (!localPath || !localPath.startsWith('file://')) {
        const fileName = getSavedImageFileName();
        localPath = FileSystem.documentDirectory + fileName;
        const resultDl = await FileSystem.downloadAsync(imageUrl, localPath);
        localPath = resultDl.uri;
      }

      let saved = false;
      let savedPath = '';

      try {
        const ok = await saveToFunnyfyAlbum(localPath);
        if (ok) {
          saved = true;
          savedPath = Platform.OS === 'android'
            ? `Gallery › ${FUNNYFY_FOLDER_NAME} album`
            : 'Photos';
        }
      } catch (saveErr) {
        console.warn('[Save] saveToFunnyfyAlbum failed, trying fallback:', saveErr);
      }

      if (!saved) {
        showToast(
          'Permission needed',
          'Allow FunnyFy to save photos to your gallery, then try again.',
          'warning',
        );
        await Sharing.shareAsync(localPath, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save image',
        });
        return false;
      }

      if (saved) {
        try {
          await saveToGallery({
            imageUrl,
            styleLabel: style?.label || 'Caricature',
            styleId: style?.id,
          });
        } catch (galleryErr) {
          console.warn('[Gallery] in-app save failed (non-fatal):', galleryErr);
        }

        setHasBeenSaved(true);
        if (!silent) {
          showSavedToast(savedPath);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Download/save error:', err);
      return false;
    }
  };

  const confirmNavigate = useCallback((navigate) => {
    if (hasResult && !hasBeenSaved) {
      showDialog({
        title: 'Save before leaving?',
        message: 'Your caricature hasn\'t been saved yet. What would you like to do?',
        cancelLabel: 'Cancel',
        neutralLabel: 'Discard',
        neutralDestructive: true,
        confirmLabel: 'Save',
        destructive: false,
        onCancel: closeDialog,
        onNeutral: () => {
          closeDialog();
          navigate();
        },
        onConfirm: async () => {
          closeDialog();
          const didSave = await handleDownload({ silent: true });
          if (didSave) {
            showSavedToast(`Gallery › ${FUNNYFY_FOLDER_NAME} album`);
            setTimeout(() => navigate(), 400);
          } else {
            showToast('Save failed', 'Could not save the image', 'error');
          }
        },
      });
    } else {
      navigate();
    }
  }, [hasResult, hasBeenSaved, closeDialog, showDialog, showToast, showSavedToast]);

  useEffect(() => {
    if (!backHandlerRef) return;
    backHandlerRef.current = () => confirmNavigate(onBack);
    return () => { backHandlerRef.current = null; };
  }, [backHandlerRef, confirmNavigate, onBack]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => showCompare,
        onMoveShouldSetPanResponder: () => showCompare,
        onStartShouldSetPanResponderCapture: () => showCompare,
        onMoveShouldSetPanResponderCapture: () => showCompare,
        onPanResponderGrant: () => {
          sliderUserTouchedRef.current = true;
        },
        onPanResponderMove: (evt) => {
          if (canvasWidth > 0) {
            const newMix = Math.max(0, Math.min(1, evt.nativeEvent.locationX / canvasWidth));
            setMix(newMix);
          }
        },
      }),
    [canvasWidth, showCompare],
  );

  if (!original?.imageUri) {
    return <View style={styles.resultRoot} />;
  }

  return (
    <View style={styles.resultRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={[styles.resultHeaderBand, { paddingTop: insets.top + 8 }]}>
        <View style={styles.uploadHeaderRow}>
          <PressScale onPress={() => confirmNavigate(onBack)} style={styles.uploadCircleButton}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </PressScale>

          {subscriptionInfo ? (
            <View style={styles.uploadHeaderPill}>
              <View style={styles.uploadHeaderPillProgress}>
                <View
                  style={[
                    styles.uploadHeaderPillProgressFill,
                    { width: `${resultQuotaPct}%` },
                  ]}
                />
              </View>
              <Text style={styles.uploadHeaderPillText}>
                {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                  ? `Trial · ${resultQuotaCurrent}/${resultQuotaLimit}`
                  : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} · ${resultQuotaCurrent}/${resultQuotaLimit}`}
              </Text>
            </View>
          ) : (
            <View style={{ width: 40 }} />
          )}

          <PressScale onPress={() => confirmNavigate(onHome)} style={styles.uploadCircleButton}>
            <Feather name="home" size={20} color="#FFFFFF" />
          </PressScale>
        </View>

        {style ? (
          <View style={[styles.uploadFloatingChipRow, { marginTop: 8 }]}>
            <View style={styles.uploadFloatingChip}>
              <View
                style={[
                  styles.uploadFloatingChipDot,
                  loading && styles.resultChipDotLoading,
                ]}
              />
              <Text style={styles.uploadFloatingChipText} numberOfLines={1}>
                {loading ? 'Generating…' : style.label}
              </Text>
            </View>
            {hasResult && !loading ? (
              <View style={styles.uploadFloatingChip}>
                <Feather name="check-circle" size={14} color="#10B981" />
                <Text style={styles.uploadFloatingChipText}>Ready</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.resultPreviewBand}>
        <View
          style={styles.resultPreviewCard}
          onLayout={(e) => setCanvasWidth(e.nativeEvent.layout.width)}
        >
          <View style={styles.resultCompareCanvas}>
            {displayUri ? (
              <Image
                source={{ uri: displayUri }}
                style={styles.resultCompareImage}
                resizeMode="cover"
                onError={() => setPreviewError(true)}
              />
            ) : original?.imageUri ? (
              <Image
                source={{ uri: original.imageUri }}
                style={styles.resultCompareImage}
                resizeMode="cover"
              />
            ) : null}

            {showCompare && original?.imageUri ? (
              <View style={[styles.afterMask, { width: `${mix * 100}%` }]}>
                <Image
                  source={{ uri: original.imageUri }}
                  style={[
                    styles.resultCompareImage,
                    canvasWidth > 0 && { width: canvasWidth },
                  ]}
                  resizeMode="cover"
                />
              </View>
            ) : null}

            {showCompare ? (
              <>
                <View style={[styles.resultCompareBadge, styles.resultCompareBadgeLeft]}>
                  <Text style={styles.resultCompareBadgeText}>Before</Text>
                </View>
                <View style={[styles.resultCompareBadge, styles.resultCompareBadgeRight]}>
                  <Text style={styles.resultCompareBadgeText}>After</Text>
                </View>
              </>
            ) : null}

            {showCompare && canvasWidth > 0 ? (
              <View pointerEvents="none" style={styles.sliderHandleContainer}>
                <View style={[styles.sliderLine, { left: canvasWidth * mix - 1 }]} />
                <View style={[styles.sliderKnob, { left: canvasWidth * mix - 18 }]}>
                  <View style={styles.sliderKnobIconRow}>
                    <Feather name="chevron-left" size={14} color="#0F172A" />
                    <Feather name="chevron-right" size={14} color="#0F172A" />
                  </View>
                </View>
              </View>
            ) : null}

            {showLoadingOverlay ? (
              <View style={styles.resultLoadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.resultLoadingTitle}>
                  {progressCopy.title}
                </Text>
                <Text style={styles.resultLoadingSubtitle}>
                  {progressCopy.subtitle}
                </Text>
                {progressCopy.statusHint ? (
                  <Text style={styles.resultLoadingStatusHint}>
                    {progressCopy.statusHint}
                  </Text>
                ) : null}
                <View style={styles.resultLoadingDots}>
                  {Array.from({ length: JOB_PROGRESS_PHASE_COUNT }).map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.resultLoadingDot,
                        index <= progressCopy.phaseIndex && styles.resultLoadingDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {previewError ? (
              <View style={styles.resultLoadingOverlay}>
                <Feather name="image" size={28} color="rgba(255,255,255,0.55)" />
                <Text style={styles.resultLoadingTitle}>Preview unavailable</Text>
                <Text style={styles.resultLoadingSubtitle}>
                  Save or share may still work once the image finishes loading.
                </Text>
              </View>
            ) : null}

            {showCompare ? (
              <View style={styles.previewOverlay} {...panResponder.panHandlers} />
            ) : null}

            {showCompare ? (
              <View style={styles.resultCompareHintOverlay} pointerEvents="none">
                <Feather name="move" size={13} color="rgba(255,255,255,0.75)" />
                <Text style={styles.resultCompareHintText}>Drag to compare before & after</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={[styles.resultActionBand, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {!loading && maxRetriesReached ? (
          <View style={styles.errorRetryContainer}>
            <Text style={styles.errorRetryTitle}>Please try again later</Text>
            <Text style={styles.errorRetrySubtext}>
              Failed generations are not billed. Your usage counter is unchanged.
            </Text>
            <PressScale onPress={onBack} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Choose another photo</Text>
            </PressScale>
          </View>
        ) : null}

        {!loading && error && !maxRetriesReached ? (
          <View style={styles.errorRetryContainer}>
            <View style={styles.errorRetryHeader}>
              <Feather name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorRetryMessage}>{error}</Text>
            </View>
            <PressScale onPress={onRetry} style={styles.retryButton} disabled={loading}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </PressScale>
          </View>
        ) : null}

        {hasResult && onTryAnotherStyle ? (
          <PressScale
            style={[styles.resultGhostButton, loading && styles.buttonDisabled]}
            onPress={() => confirmNavigate(onTryAnotherStyle)}
            disabled={loading}
          >
            <Feather name="refresh-cw" size={16} color="#FFFFFF" />
            <Text style={styles.resultGhostButtonText}>Try another style</Text>
          </PressScale>
        ) : null}

        <View style={styles.resultActionRow}>
          <PressScale
            style={[
              styles.resultActionButton,
              hasBeenSaved && styles.resultActionButtonSaved,
              (!hasResult || loading) && styles.buttonDisabled,
            ]}
            onPress={handleDownload}
            disabled={!hasResult || loading}
          >
            <Feather
              name={hasBeenSaved ? 'check' : 'download'}
              size={18}
              color={hasBeenSaved ? '#10B981' : '#0F172A'}
            />
            <Text
              style={[
                styles.resultActionButtonText,
                hasBeenSaved && styles.resultActionButtonTextSaved,
              ]}
              numberOfLines={1}
            >
              {hasBeenSaved ? 'Saved' : 'Save'}
            </Text>
          </PressScale>

          <PressScale
            style={[
              styles.resultActionButton,
              (!hasResult || loading) && styles.buttonDisabled,
            ]}
            onPress={handleShare}
            disabled={!hasResult || loading}
          >
            <Feather name="share-2" size={18} color="#0F172A" />
            <Text style={styles.resultActionButtonText} numberOfLines={1}>Share</Text>
          </PressScale>
        </View>
      </View>
    </View>
  );
}
