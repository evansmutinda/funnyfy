import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  PanResponder,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import { useNotifications } from '../components/NotificationProvider';
import { SkeletonLoader } from '../components/MenuModal';
import { saveToGallery } from './GalleryScreen';
import {
  BOTTOM_INSET_MIN,
  FUNNYFY_FOLDER_NAME,
  getSavedImageFileName,
  saveToFunnyfyAlbum,
} from '../constants';
import styles from '../styles';

export function getImageUrlFromOutput(output) {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.length > 0) {
    return typeof output[0] === 'string' ? output[0] : output[0]?.url || null;
  }
  return output.url || null;
}

export default function ResultScreen({ original, result, loading, error, failedAttempts = 0, onRetry, onBack, onHome, onOpenGallery, onTryAnotherStyle, subscriptionInfo, backHandlerRef, style }) {
  const insets = useSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const imageUrl = result ? getImageUrlFromOutput(result.output) : null;
  const [mix, setMix] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const sliderDemoDoneRef = useRef(false);
  const sliderUserTouchedRef = useRef(false);
  const hasResult = !!result && !!imageUrl;
  const maxRetriesReached = error && failedAttempts >= 3;

  const resultQuotaCurrent = subscriptionInfo?.usage?.current ?? 0;
  const resultQuotaLimit = subscriptionInfo?.usage?.limit ?? 3;
  const resultQuotaPct = resultQuotaLimit > 0 ? Math.min(100, (resultQuotaCurrent / resultQuotaLimit) * 100) : 0;

  useEffect(() => {
    if (hasResult) {
      setMix(0);
      setHasBeenSaved(false);
      sliderDemoDoneRef.current = false;
      sliderUserTouchedRef.current = false;
    }
  }, [hasResult, imageUrl]);

  const showSavedToast = useCallback((savedPath) => {
    showToast('Saved', savedPath, 'success', {
      actionLabel: 'View in Gallery',
      onAction: () => onOpenGallery?.(),
    });
  }, [onOpenGallery, showToast]);

  useEffect(() => {
    if (!hasResult || canvasWidth <= 0 || sliderDemoDoneRef.current) return undefined;

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
  }, [hasResult, canvasWidth, imageUrl]);

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
      const fileName = getSavedImageFileName();
      const localPath = FileSystem.documentDirectory + fileName;

      const resultDl = await FileSystem.downloadAsync(imageUrl, localPath);

      let saved = false;
      let savedPath = '';

      try {
        const ok = await saveToFunnyfyAlbum(resultDl.uri);
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
        await Sharing.shareAsync(resultDl.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save image',
        });
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
  }, [hasResult, hasBeenSaved]);

  useEffect(() => {
    if (!backHandlerRef) return;
    backHandlerRef.current = () => confirmNavigate(onBack);
    return () => { backHandlerRef.current = null; };
  }, [backHandlerRef, confirmNavigate, onBack]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
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
    [canvasWidth]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={[styles.resultContainer, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => confirmNavigate(onBack)} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          {subscriptionInfo && (
            <View style={styles.headerPill}>
              <View style={styles.headerPillProgress}>
                <View style={[styles.headerPillProgressFill, { width: `${resultQuotaPct}%` }]} />
              </View>
              <Text style={styles.headerPillText}>
                {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                  ? `Trial · ${resultQuotaCurrent}/${resultQuotaLimit}`
                  : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} · ${resultQuotaCurrent}/${resultQuotaLimit}`}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={() => confirmNavigate(onHome)} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>⌂</Text>
          </TouchableOpacity>
        </View>

        {original?.imageUri ? (
          <View style={styles.previewContainer}>
            <View
              style={styles.previewCanvas}
              onLayout={(e) => setCanvasWidth(e.nativeEvent.layout.width)}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
              ) : null}
              {original?.imageUri ? (
                <View style={[styles.afterMask, { width: `${mix * 100}%` }]}>
                  <Image source={{ uri: original.imageUri }} style={styles.previewImage} resizeMode="cover" />
                </View>
              ) : null}
              {canvasWidth > 0 && (
                <View pointerEvents="none" style={styles.sliderHandleContainer}>
                  <View
                    style={[
                      styles.sliderLine,
                      { left: canvasWidth * mix - 1 },
                    ]}
                  />
                  <View
                    style={[
                      styles.sliderKnob,
                      { left: canvasWidth * mix - 16 },
                    ]}
                  >
                    <Text style={styles.sliderKnobText}>‹›</Text>
                  </View>
                </View>
              )}
              <View style={styles.previewOverlay} {...panResponder.panHandlers} />
            </View>
            {hasResult ? (
              <>
                <Text style={styles.sectionLabel}>Drag to compare before & after</Text>
              </>
            ) : null}

            <View style={styles.bottomActionsContainer}>
              {loading ? (
                <View style={styles.progressContainer}>
                  <SkeletonLoader />
                </View>
              ) : maxRetriesReached ? (
                <View style={styles.errorRetryContainer}>
                  <Text style={styles.errorRetryTitle}>Please try again later</Text>
                  <Text style={styles.errorRetrySubtext}>
                    Failed generations are not billed. Your usage counter is unchanged.
                  </Text>
                  <TouchableOpacity onPress={onBack} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Choose another photo</Text>
                  </TouchableOpacity>
                </View>
              ) : error ? (
                <View style={styles.errorRetryContainer}>
                  <View style={styles.errorRetryHeader}>
                    <Feather name="alert-circle" size={18} color="#DC2626" />
                    <Text style={styles.errorRetryMessage}>{error}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={onRetry}
                    style={styles.retryButton}
                    disabled={loading}
                  >
                    <Text style={styles.retryButtonText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1 }, (!hasResult || loading) && styles.buttonDisabled]}
                  onPress={handleDownload}
                  disabled={!hasResult || loading}
                >
                  <Text style={styles.primaryButtonText} numberOfLines={1}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1 }, (!hasResult || loading) && styles.buttonDisabled]}
                  onPress={handleShare}
                  disabled={!hasResult || loading}
                >
                  <Text style={styles.primaryButtonText} numberOfLines={1}>Share</Text>
                </TouchableOpacity>
              </View>
              {hasResult && onTryAnotherStyle ? (
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.tryAnotherStyleButton, loading && styles.buttonDisabled]}
                  onPress={() => confirmNavigate(onTryAnotherStyle)}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>Try another style</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
