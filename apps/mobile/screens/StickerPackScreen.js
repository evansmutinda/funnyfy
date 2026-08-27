import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import PressScale from '../components/PressScale';
import { useNotifications } from '../components/NotificationProvider';
import { saveToGallery } from './GalleryScreen';
import {
  FUNNYFY_FOLDER_NAME,
  getSavedImageFileName,
  getStyleImage,
  SAVED_IMAGE_MIME,
  saveToFunnyfyAlbum,
} from '../constants';
import { isStickerStyle } from '../utils/stickerPack';
import {
  JOB_PROGRESS_PHASE_COUNT,
  getJobProgressCopy,
  resolveCategoryCreatingPhrase,
} from '../utils/jobProgress';
import { getUsageQuotaInfo } from '../utils/usageQuota';
import styles from '../styles';

function getUsagePillLabel(subscriptionInfo, quotaInfo) {
  if (!subscriptionInfo?.subscription) {
    return 'No plan';
  }
  const tier = subscriptionInfo.subscription.tier;
  return `${tier.charAt(0).toUpperCase()}${tier.slice(1)} · ${quotaInfo.current}/${quotaInfo.limit}`;
}

export default function StickerPackScreen({
  selectedStyles = [],
  loading = false,
  job = null,
  errorMessage = '',
  sheetUrl = null,
  onBack,
  onOpenUsage,
  subscriptionInfo,
}) {
  const insets = useSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [progressTick, setProgressTick] = useState(0);

  const previewStyles = useMemo(
    () => selectedStyles.filter(isStickerStyle),
    [selectedStyles],
  );
  const creatingPhrase = useMemo(
    () => resolveCategoryCreatingPhrase({ id: 'sticker-sheet', categoryId: 'stickers' }),
    [],
  );
  const progressCopy = useMemo(
    () => getJobProgressCopy(job, {
      creatingPhrase,
      loading,
      now: Date.now(),
    }),
    [job, creatingPhrase, loading, progressTick],
  );

  useEffect(() => {
    if (!loading || job?.status !== 'processing') return undefined;
    const id = setInterval(() => setProgressTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [loading, job?.status]);

  useEffect(() => {
    if (sheetUrl) setHasBeenSaved(false);
  }, [sheetUrl]);

  const actionsBusy = saving || sharing || loading;
  const saveDisabled = !sheetUrl || actionsBusy;
  const sheetReady = Boolean(sheetUrl) && !loading;
  const quotaInfo = getUsageQuotaInfo(subscriptionInfo);

  const albumPathLabel = Platform.OS === 'android'
    ? `Gallery › ${FUNNYFY_FOLDER_NAME} album`
    : 'Photos';

  const downloadSheet = useCallback(async () => {
    const fileName = getSavedImageFileName();
    const localPath = FileSystem.documentDirectory + fileName;
    const resultDl = await FileSystem.downloadAsync(sheetUrl, localPath);
    if (resultDl.status !== 200) {
      throw new Error(`Download failed (${resultDl.status})`);
    }
    return resultDl.uri;
  }, [sheetUrl]);

  const handleShare = async () => {
    if (saveDisabled) return;
    setSharing(true);
    try {
      const uri = await downloadSheet();
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error('Share is unavailable on this device.');
      }
      await Sharing.shareAsync(uri, {
        mimeType: SAVED_IMAGE_MIME,
        dialogTitle: 'Check out my FunnyFy sticker pack!',
      });
    } catch (err) {
      console.error('Share error:', err);
      showToast('Share failed', err?.message || 'Could not share the sticker sheet.', 'error');
    } finally {
      setSharing(false);
    }
  };

  const handleSave = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!sheetUrl || loading || saving) return false;
    if (hasBeenSaved) return true;
    setSaving(true);
    try {
      const uri = await downloadSheet();
      const saveResult = await saveToFunnyfyAlbum(uri);
      if (!saveResult?.ok) {
        if (!silent) {
          showToast(
            'Could not save',
            'Allow FunnyFy to save photos to your gallery, then try again.',
            'error',
          );
        }
        return false;
      }
      await saveToGallery({
        imageUrl: sheetUrl,
        styleLabel: 'Sticker pack',
        styleId: 'sticker-sheet',
        mediaAssetId: saveResult.assetId || null,
      }).catch((galleryErr) => {
        console.warn('[Gallery] sticker sheet save failed (non-fatal):', galleryErr);
      });
      setHasBeenSaved(true);
      if (!silent) {
        showToast('Saved', albumPathLabel, 'success');
      }
      return true;
    } catch (err) {
      console.error('Save error:', err);
      if (!silent) {
        showToast('Save failed', err?.message || 'Could not save the sticker sheet.', 'error');
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [albumPathLabel, downloadSheet, hasBeenSaved, loading, saving, sheetUrl, showToast]);

  const confirmNavigate = useCallback((navigate) => {
    if (loading) {
      showDialog({
        title: 'Generation in progress',
        message: 'Your sticker pack is still being created. Please wait for it to finish.',
        hideCancel: true,
        confirmLabel: 'OK',
        onConfirm: closeDialog,
      });
      return;
    }

    if (sheetReady && !hasBeenSaved) {
      showDialog({
        title: 'Save before leaving?',
        message: "Your sticker pack hasn't been saved yet. What would you like to do?",
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
          const didSave = await handleSave({ silent: true });
          if (didSave) {
            showToast('Saved', albumPathLabel, 'success');
            setTimeout(() => navigate(), 400);
          } else {
            showToast('Save failed', 'Could not save the sticker sheet.', 'error');
          }
        },
      });
      return;
    }

    navigate();
  }, [
    albumPathLabel,
    closeDialog,
    handleSave,
    hasBeenSaved,
    loading,
    sheetReady,
    showDialog,
    showToast,
  ]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmNavigate(onBack);
      return true;
    });
    return () => sub.remove();
  }, [confirmNavigate, onBack]);

  return (
    <View style={styles.styleScreenSafe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <View style={[styles.styleScreenHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.headerBar}>
          <PressScale onPress={() => confirmNavigate(onBack)} style={styles.iconButton}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </PressScale>
          <Text style={styles.restyleHeaderTitle}>Sticker pack</Text>
          <PressScale
            onPress={() => confirmNavigate(onOpenUsage)}
            style={[
              styles.uploadHeaderPill,
              quotaInfo.isLow && styles.uploadHeaderPillLow,
            ]}
            disabled={!onOpenUsage}
          >
            <View
              style={[
                styles.uploadHeaderPillProgress,
                quotaInfo.isLow && styles.uploadHeaderPillProgressLow,
              ]}
            >
              <View
                style={[
                  styles.uploadHeaderPillProgressFill,
                  quotaInfo.isLow && styles.uploadHeaderPillProgressFillLow,
                  { width: `${Math.min(quotaInfo.percentage, 100)}%` },
                ]}
              />
            </View>
            <Text
              style={[
                styles.uploadHeaderPillText,
                quotaInfo.isLow && styles.uploadHeaderPillTextLow,
              ]}
            >
              {getUsagePillLabel(subscriptionInfo, quotaInfo)}
            </Text>
          </PressScale>
        </View>
      </View>

      <View style={styles.stickerPackBody}>
        {loading ? (
          <View style={styles.stickerPackLoadingCard}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.resultLoadingTitle}>{progressCopy.title}</Text>
            <Text style={styles.resultLoadingSubtitle}>{progressCopy.subtitle}</Text>
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
        ) : sheetUrl ? (
          <Image
            source={{ uri: sheetUrl }}
            style={styles.stickerSheetPreview}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.stickerPackLoadingCard}>
            <Text style={styles.stickerPackLead}>
              Pick 4, 9, or 12 expressions, then generate a pack.
            </Text>
          </View>
        )}

        {errorMessage ? (
          <Text style={styles.stickerPackError}>{errorMessage}</Text>
        ) : null}
      </View>

      <View style={[styles.stickerPackFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {previewStyles.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickerSelectedStrip}
          >
            {previewStyles.map((item) => (
              <View key={item.id} style={styles.stickerSelectedChip}>
                <Image
                  source={getStyleImage(item)}
                  style={styles.stickerSelectedChipImage}
                  resizeMode="contain"
                />
                <Text style={styles.stickerSelectedChipLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {sheetReady ? (
          <View style={styles.resultActionRow}>
            <PressScale
              style={[
                styles.resultActionButton,
                hasBeenSaved && styles.resultActionButtonSaved,
                saveDisabled && styles.buttonDisabled,
              ]}
              onPress={() => handleSave()}
              disabled={saveDisabled || hasBeenSaved}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Feather
                  name={hasBeenSaved ? 'check' : 'download'}
                  size={18}
                  color={hasBeenSaved ? '#10B981' : '#0F172A'}
                />
              )}
              <Text
                style={[
                  styles.resultActionButtonText,
                  hasBeenSaved && styles.resultActionButtonTextSaved,
                ]}
              >
                {saving ? 'Saving…' : hasBeenSaved ? 'Saved' : 'Save'}
              </Text>
            </PressScale>
            <PressScale
              style={[styles.resultActionButton, saveDisabled && styles.buttonDisabled]}
              onPress={handleShare}
              disabled={saveDisabled}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Feather name="share-2" size={18} color="#0F172A" />
              )}
              <Text style={styles.resultActionButtonText}>
                {sharing ? 'Sharing…' : 'Share'}
              </Text>
            </PressScale>
          </View>
        ) : null}
      </View>
    </View>
  );
}
