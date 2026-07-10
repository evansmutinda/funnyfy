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
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import { useNotifications } from '../components/NotificationProvider';
import PressScale from '../components/PressScale';
import UploadFlowHeader from '../components/UploadFlowHeader';
import { saveToGallery } from './GalleryScreen';
import {
  FUNNYFY_FOLDER_NAME,
  getSavedImageFileName,
  SAVED_IMAGE_MIME,
  saveToFunnyfyAlbum,
} from '../constants';
import {
  getJobProgressCopy,
  JOB_PROGRESS_PHASE_COUNT,
  resolveCategoryCreatingPhrase,
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
  onTryAnotherPhoto,
  subscriptionInfo,
  onOpenUsage,
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

  const creatingPhrase = useMemo(() => resolveCategoryCreatingPhrase(style), [style]);

  const progressCopy = useMemo(
    () => getJobProgressCopy(job, {
      creatingPhrase,
      loading: loading && !hasResult,
      now: Date.now(),
    }),
    [job, creatingPhrase, loading, hasResult, progressTick],
  );

  useEffect(() => {
    if (!loading || hasResult || job?.status !== 'processing') return undefined;
    const id = setInterval(() => setProgressTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [loading, hasResult, job?.status]);
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

    // Temporary cache for on-screen preview only — not the DCIM/Funnyfy save name.
    (async () => {
      try {
        const path = `${FileSystem.cacheDirectory}result_preview_${Date.now()}.png`;
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
        mimeType: SAVED_IMAGE_MIME,
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

      if (localPreviewUri?.startsWith('file://')) {
        await FileSystem.copyAsync({ from: localPreviewUri, to: localPath });
      } else {
        const resultDl = await FileSystem.downloadAsync(imageUrl, localPath);
        if (resultDl.status !== 200) {
          throw new Error(`Download failed (${resultDl.status})`);
        }
      }

      let saved = false;
      let savedPath = '';

      const saveResult = await saveToFunnyfyAlbum(localPath);
      if (saveResult?.ok) {
        saved = true;
        savedPath = Platform.OS === 'android'
          ? `Gallery › ${FUNNYFY_FOLDER_NAME} album`
          : 'Photos';
      }

      if (!saved) {
        showToast(
          'Could not save',
          'Allow FunnyFy to save photos to your gallery, then try again.',
          'error',
        );
        return false;
      }

      if (saved) {
        try {
          await saveToGallery({
            imageUrl,
            styleLabel: style?.label || 'Caricature',
            styleId: style?.id,
            mediaAssetId: saveResult.assetId || null,
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
    const generationInProgress = loading && !hasResult;

    if (generationInProgress) {
      showDialog({
        title: 'Generation in progress',
        message: 'Your caricature is still being created. Please wait for it to finish.',
        hideCancel: true,
        confirmLabel: 'OK',
        onConfirm: closeDialog,
      });
      return;
    }

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
  }, [
    loading,
    hasResult,
    hasBeenSaved,
    closeDialog,
    showDialog,
    showToast,
    showSavedToast,
  ]);

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
        <UploadFlowHeader
          onBack={() => confirmNavigate(onBack)}
          onStylePress={() => confirmNavigate(onBack)}
          style={style}
          subscriptionInfo={subscriptionInfo}
          onOpenUsage={onOpenUsage}
          trailingAction={{
            icon: 'home',
            onPress: () => confirmNavigate(onHome),
          }}
        />
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

        {hasResult && (onTryAnotherStyle || onTryAnotherPhoto) ? (
          <View style={styles.uploadInlineActionsRow}>
            {onTryAnotherPhoto ? (
              <PressScale
                style={[styles.uploadSmallGhostButton, loading && styles.buttonDisabled]}
                onPress={() => confirmNavigate(onTryAnotherPhoto)}
                disabled={loading}
              >
                <Feather name="image" size={14} color="#FFFFFF" />
                <Text style={styles.uploadSmallGhostButtonText}>Try another photo</Text>
              </PressScale>
            ) : null}
            {onTryAnotherStyle ? (
              <PressScale
                style={[styles.uploadSmallGhostButton, loading && styles.buttonDisabled]}
                onPress={() => confirmNavigate(onTryAnotherStyle)}
                disabled={loading}
              >
                <Feather name="refresh-ccw" size={14} color="#FFFFFF" />
                <Text style={styles.uploadSmallGhostButtonText}>Try another style</Text>
              </PressScale>
            ) : null}
          </View>
        ) : null}

        <View style={styles.resultActionRow}>
          <PressScale
            style={[
              styles.resultActionButton,
              hasBeenSaved && styles.resultActionButtonSaved,
              (!hasResult || loading) && styles.buttonDisabled,
            ]}
            onPress={() => handleDownload()}
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
