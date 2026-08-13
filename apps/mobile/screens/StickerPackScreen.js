import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
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
import { BOTTOM_INSET_MIN, getStyleImage } from '../constants';
import { isStickerStyle } from '../utils/stickerPack';
import styles from '../styles';

function writeWebpFile(base64, name) {
  const path = `${FileSystem.cacheDirectory}${name}`;
  return FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  }).then(() => path);
}

export default function StickerPackScreen({
  selectedStyles = [],
  results = [],
  loading = false,
  progressLabel = '',
  errorMessage = '',
  pack = null,
  sheetUrl = null,
  onBack,
  onOpenUsage,
  subscriptionInfo,
}) {
  const insets = useSafeAreaInsets();
  const { showToast } = useNotifications();
  const [sharingTarget, setSharingTarget] = useState(null);

  const completed = useMemo(
    () => results.filter((item) => item?.outputUrl),
    [results],
  );

  const previewStyles = selectedStyles.filter(isStickerStyle);

  const shareSticker = async (sticker, dialogTitle) => {
    const path = await writeWebpFile(sticker.webpBase64, `funnyfy-${sticker.styleId}.webp`);
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      throw new Error('Share is unavailable on this device.');
    }
    await Sharing.shareAsync(path, {
      mimeType: 'image/webp',
      dialogTitle,
      UTI: 'public.webp',
    });
  };

  const handleShareWhatsApp = async () => {
    if (!pack?.stickers?.length) return;
    setSharingTarget('whatsapp');
    try {
      await shareSticker(pack.stickers[0], 'Add FunnyFy sticker to WhatsApp');
      showToast(
        'WhatsApp',
        'Tap a sticker above to share the next WebP, or use a sticker-maker app for the full pack.',
        'info',
      );
    } catch (err) {
      showToast('Share failed', err?.message || 'Could not share stickers.', 'error');
    } finally {
      setSharingTarget(null);
    }
  };

  const handleShareTelegram = async () => {
    if (!pack?.stickers?.length) return;
    setSharingTarget('telegram');
    try {
      if (pack.telegram?.botUrl) {
        await Linking.openURL(pack.telegram.botUrl);
        return;
      }
      await shareSticker(pack.stickers[0], 'Add FunnyFy sticker to Telegram');
      showToast('Telegram', 'Tap a sticker above to share the next WebP into Telegram.', 'info');
    } catch (err) {
      showToast('Telegram', err?.message || 'Could not open Telegram.', 'error');
    } finally {
      setSharingTarget(null);
    }
  };

  const handleShareAll = async () => {
    if (!pack?.stickers?.length) return;
    setSharingTarget('all');
    try {
      await shareSticker(pack.stickers[0], 'Share FunnyFy sticker');
      showToast('Share', 'Tap any sticker above to share its WebP.', 'info');
    } catch (err) {
      showToast('Share failed', err?.message || 'Could not share the sticker pack.', 'error');
    } finally {
      setSharingTarget(null);
    }
  };

  const handleShareOne = async (styleId) => {
    const sticker = pack?.stickers?.find((item) => item.styleId === styleId);
    if (!sticker || sharingTarget) return;
    setSharingTarget(styleId);
    try {
      await shareSticker(sticker, `Share ${sticker.label || 'sticker'}`);
    } catch (err) {
      showToast('Share failed', err?.message || 'Could not share this sticker.', 'error');
    } finally {
      setSharingTarget(null);
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
            ? sheetUrl
              ? 'Splitting the sheet into stickers…'
              : 'Generating your sticker sheet…'
            : pack
              ? `${pack.stickers.length} WebP stickers ready to share.`
              : 'Pick 4 or 9 expressions, then generate a pack.'}
        </Text>

        {sheetUrl ? (
          <Image
            source={{ uri: sheetUrl }}
            style={styles.stickerSheetPreview}
            resizeMode="contain"
          />
        ) : null}

        {progressLabel ? (
          <Text style={styles.stickerPackProgress}>{progressLabel}</Text>
        ) : null}

        {errorMessage ? (
          <Text style={styles.stickerPackError}>{errorMessage}</Text>
        ) : null}

        <View style={styles.stickerPackGrid}>
          {previewStyles.map((item) => {
            const done = completed.find((entry) => entry.styleId === item.id);
            const ready = Boolean(pack?.stickers?.some((sticker) => sticker.styleId === item.id));
            return (
              <PressScale
                key={item.id}
                style={styles.stickerPackCard}
                onPress={() => (ready ? handleShareOne(item.id) : null)}
                disabled={!ready || Boolean(sharingTarget)}
              >
                <Image
                  source={done?.outputUrl ? { uri: done.outputUrl } : getStyleImage(item)}
                  style={styles.stickerPackThumb}
                  resizeMode="contain"
                />
                <Text style={styles.stickerPackCardLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                {loading && !done ? (
                  <View style={styles.stickerPackCardOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                ) : null}
              </PressScale>
            );
          })}
        </View>

        {pack ? (
          <View style={styles.stickerPackActions}>
            <PressScale
              style={[styles.resultActionButton, sharingTarget && styles.buttonDisabled]}
              onPress={handleShareWhatsApp}
              disabled={Boolean(sharingTarget)}
            >
              {sharingTarget === 'whatsapp' ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Feather name="message-circle" size={18} color="#0F172A" />
              )}
              <Text style={styles.resultActionButtonText}>WhatsApp</Text>
            </PressScale>
            <PressScale
              style={[styles.resultActionButton, sharingTarget && styles.buttonDisabled]}
              onPress={handleShareTelegram}
              disabled={Boolean(sharingTarget)}
            >
              {sharingTarget === 'telegram' ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Feather name="send" size={18} color="#0F172A" />
              )}
              <Text style={styles.resultActionButtonText}>Telegram</Text>
            </PressScale>
            <PressScale
              style={[styles.uploadSmallGhostButton, sharingTarget && styles.buttonDisabled]}
              onPress={handleShareAll}
              disabled={Boolean(sharingTarget)}
            >
              <Feather name="share-2" size={14} color="#FFFFFF" />
              <Text style={styles.uploadSmallGhostButtonText}>Share WebP</Text>
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
