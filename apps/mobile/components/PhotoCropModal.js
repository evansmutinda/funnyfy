import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  StatusBar,
  Text,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressScale from './PressScale';
import styles from '../styles';

const MIN_CROP_PX = 64;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Optional crop after upload. Crop frame starts on the full photo
 * (unlike the Android OS editor's centered 1:1 default).
 */
export default function PhotoCropModal({ visible, uri, onCancel, onDone }) {
  const insets = useSafeAreaInsets();
  const [natural, setNatural] = useState(null);
  const [layout, setLayout] = useState(null);
  const [crop, setCrop] = useState(null);
  const [busy, setBusy] = useState(false);
  const cropRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!visible || !uri) return;
    setNatural(null);
    setCrop(null);
    setBusy(false);
    Image.getSize(
      uri,
      (width, height) => setNatural({ width, height }),
      () => setNatural(null)
    );
  }, [visible, uri]);

  const fitted = useMemo(() => {
    if (!natural || !layout?.width || !layout?.height) return null;
    const scale = Math.min(layout.width / natural.width, layout.height / natural.height);
    const width = natural.width * scale;
    const height = natural.height * scale;
    const left = (layout.width - width) / 2;
    const top = (layout.height - height) / 2;
    return { left, top, width, height, scale };
  }, [natural, layout]);

  useEffect(() => {
    if (!fitted) return;
    const next = {
      x: fitted.left,
      y: fitted.top,
      w: fitted.width,
      h: fitted.height,
    };
    cropRef.current = next;
    setCrop(next);
  }, [fitted]);

  const updateCrop = useCallback((next) => {
    cropRef.current = next;
    setCrop(next);
  }, []);

  const makeCornerResponder = useCallback(
    (corner) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragRef.current = { ...cropRef.current };
        },
        onPanResponderMove: (_evt, gesture) => {
          if (!fitted || !dragRef.current) return;
          const start = dragRef.current;
          let { x, y, w, h } = start;
          const dx = gesture.dx;
          const dy = gesture.dy;

          if (corner.includes('l')) {
            const nx = clamp(start.x + dx, fitted.left, start.x + start.w - MIN_CROP_PX);
            w = start.w - (nx - start.x);
            x = nx;
          }
          if (corner.includes('r')) {
            w = clamp(start.w + dx, MIN_CROP_PX, fitted.left + fitted.width - start.x);
          }
          if (corner.includes('t')) {
            const ny = clamp(start.y + dy, fitted.top, start.y + start.h - MIN_CROP_PX);
            h = start.h - (ny - start.y);
            y = ny;
          }
          if (corner.includes('b')) {
            h = clamp(start.h + dy, MIN_CROP_PX, fitted.top + fitted.height - start.y);
          }

          updateCrop({ x, y, w, h });
        },
      }),
    [fitted, updateCrop]
  );

  const moveResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragRef.current = { ...cropRef.current };
        },
        onPanResponderMove: (_evt, gesture) => {
          if (!fitted || !dragRef.current) return;
          const start = dragRef.current;
          const x = clamp(start.x + gesture.dx, fitted.left, fitted.left + fitted.width - start.w);
          const y = clamp(start.y + gesture.dy, fitted.top, fitted.top + fitted.height - start.h);
          updateCrop({ ...start, x, y });
        },
      }),
    [fitted, updateCrop]
  );

  const tl = useMemo(() => makeCornerResponder('tl'), [makeCornerResponder]);
  const tr = useMemo(() => makeCornerResponder('tr'), [makeCornerResponder]);
  const bl = useMemo(() => makeCornerResponder('bl'), [makeCornerResponder]);
  const br = useMemo(() => makeCornerResponder('br'), [makeCornerResponder]);

  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  };

  const handleApply = async () => {
    if (!uri || !natural || !fitted || !cropRef.current || busy) return;
    setBusy(true);
    try {
      const c = cropRef.current;
      const originX = Math.round((c.x - fitted.left) / fitted.scale);
      const originY = Math.round((c.y - fitted.top) / fitted.scale);
      const width = Math.round(c.w / fitted.scale);
      const height = Math.round(c.h / fitted.scale);

      const almostFull =
        originX <= 1 &&
        originY <= 1 &&
        width >= natural.width - 2 &&
        height >= natural.height - 2;

      if (almostFull) {
        onCancel?.();
        return;
      }

      const cropped = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: clamp(originX, 0, natural.width - 1),
              originY: clamp(originY, 0, natural.height - 1),
              width: clamp(width, 1, natural.width - originX),
              height: clamp(height, 1, natural.height - originY),
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      const base64 = await FileSystem.readAsStringAsync(cropped.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      onDone?.({
        uri: cropped.uri,
        dataUrl: `data:image/jpeg;base64,${base64}`,
      });
    } catch (err) {
      console.error('[PhotoCropModal] crop failed:', err);
      onCancel?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.cropModalRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        <View style={[styles.cropModalHeader, { paddingTop: insets.top + 8 }]}>
          <PressScale onPress={onCancel} style={styles.cropModalHeaderBtn} disabled={busy}>
            <Text style={styles.cropModalHeaderBtnText}>Cancel</Text>
          </PressScale>
          <Text style={styles.cropModalTitle}>Crop</Text>
          <PressScale onPress={handleApply} style={styles.cropModalHeaderBtn} disabled={busy}>
            {busy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.cropModalHeaderBtnText, styles.cropModalHeaderBtnTextStrong]}>
                Done
              </Text>
            )}
          </PressScale>
        </View>

        <View style={styles.cropModalStage} onLayout={onLayout}>
          {uri ? (
            <Image source={{ uri }} style={styles.cropModalImage} resizeMode="contain" />
          ) : null}

          {fitted && crop ? (
            <View
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              pointerEvents="box-none"
            >
              <View
                pointerEvents="none"
                style={[styles.cropDim, { top: 0, left: 0, right: 0, height: crop.y }]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.cropDim,
                  { top: crop.y + crop.h, left: 0, right: 0, bottom: 0 },
                ]}
              />
              <View
                pointerEvents="none"
                style={[styles.cropDim, { top: crop.y, left: 0, width: crop.x, height: crop.h }]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.cropDim,
                  { top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h },
                ]}
              />

              <View
                style={[
                  styles.cropFrame,
                  { left: crop.x, top: crop.y, width: crop.w, height: crop.h },
                ]}
                {...moveResponder.panHandlers}
              >
                <View style={[styles.cropHandle, styles.cropHandleTL]} {...tl.panHandlers} />
                <View style={[styles.cropHandle, styles.cropHandleTR]} {...tr.panHandlers} />
                <View style={[styles.cropHandle, styles.cropHandleBL]} {...bl.panHandlers} />
                <View style={[styles.cropHandle, styles.cropHandleBR]} {...br.panHandlers} />
              </View>
            </View>
          ) : null}
        </View>

        <View style={[styles.cropModalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.cropModalHint}>
            Starts on the full photo — drag corners to tighten for face-focused styles
          </Text>
        </View>
      </View>
    </Modal>
  );
}
