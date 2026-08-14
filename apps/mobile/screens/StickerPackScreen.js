import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  BOTTOM_INSET_MIN,
  FUNNYFY_FOLDER_NAME,
  getSavedImageFileName,
  getStyleImage,
  SAVED_IMAGE_MIME,
  saveToFunnyfyAlbum,
} from '../constants';
import { isStickerStyle, stickerSheetAspectRatio } from '../utils/stickerPack';
import {
  JOB_PROGRESS_PHASE_COUNT,
  getJobProgressCopy,
  resolveCategoryCreatingPhrase,
} from '../utils/jobProgress';
import styles from '../styles';

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
  const { showToast } = useNotifications();
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

  const actionsBusy = saving || sharing || loading;
  const saveDisabled = !sheetUrl || actionsBusy;
  const sheetReady = Boolean(sheetUrl) && !loading;

  const albumPathLabel = Platform.OS === 'android'
    ? `Gallery › ${FUNNYFY_FOLDER_NAME} album`
    : 'Photos';

  const downloadSheet = async () => {
    const fileName = getSavedImageFileName();
    const localPath = FileSystem.documentDirectory + fileName;
    const resultDl = await FileSystem.downloadAsync(sheetUrl, localPath);
    if (resultDl.status !== 200) {
      throw new Error(`Download failed (${resultDl.status})`);
    }
    return resultDl.uri;
  };

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

  const handleSave = async () => {
    if (saveDisabled || hasBeenSaved) return;
    setSaving(true);
    try {
      const uri = await downloadSheet();
      const saveResult = await saveToFunnyfyAlbum(uri);
      if (!saveResult?.ok) {
        showToast(
          'Could not save',
          'Allow FunnyFy to save photos to your gallery, then try again.',
          'error',
        );
        return;
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
      showToast('Saved', albumPathLabel, 'success');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Save failed', err?.message || 'Could not save the sticker sheet.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.styleScreenSafe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <View style={[styles.styleScreenHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.headerBar}>
          <PressScale onPress={onBack} style={styles.iconButton}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </PressScale>
          <Text style={styles.restyleHeaderTitle}>Sticker pack</Text>
          <PressScale onPress={onOpenUsage} style={styles.iconButton} hitSlop={8}>
            <Feather name="pie-chart" size={18} color="#FFFFFF" />
          </PressScale>
        </View>
      </View>

      <ScrollView
        style={styles.styleScroll}
        contentContainerStyle={[
          styles.stickerPackContainer,
          { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stickerPackLead}>
          {loading
            ? progressCopy.title
            : sheetReady
              ? `${previewStyles.length} stickers on one sheet — save or share.`
              : 'Pick 4, 9, or 12 expressions, then generate a pack.'}
        </Text>

        {loading ? (
          <View style={styles.stickerPackLoadingCard}>
            <ActivityIndicator size="large" color="#FFFFFF" />
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
            {progressCopy.statusHint ? (
              <Text style={styles.resultLoadingStatusHint}>{progressCopy.statusHint}</Text>
            ) : null}
          </View>
        ) : sheetUrl ? (
          <Image
            source={{ uri: sheetUrl }}
            style={[
              styles.stickerSheetPreview,
              { aspectRatio: stickerSheetAspectRatio(previewStyles.length) },
            ]}
            resizeMode="contain"
          />
        ) : null}

        {errorMessage ? (
          <Text style={styles.stickerPackError}>{errorMessage}</Text>
        ) : null}

        {previewStyles.length ? (
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
              onPress={handleSave}
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

        {subscriptionInfo?.isTrial ? (
          <Text style={styles.stickerPackHint}>
            Trial has 3 generations. A sticker pack uses 1 generation.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
