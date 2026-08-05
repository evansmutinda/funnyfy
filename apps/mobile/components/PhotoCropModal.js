import React, { useEffect, useRef, useState } from 'react';
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

const MIN_CROP_PX = 80;
const CORNER_HIT = 44;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hitMode(crop, pageX, pageY, stagePage) {
  if (!crop || !stagePage) return 'br';
  const lx = pageX - stagePage.x;
  const ly = pageY - stagePage.y;
  const nearL = Math.abs(lx - crop.x) <= CORNER_HIT;
  const nearR = Math.abs(lx - (crop.x + crop.w)) <= CORNER_HIT;
  const nearT = Math.abs(ly - crop.y) <= CORNER_HIT;
  const nearB = Math.abs(ly - (crop.y + crop.h)) <= CORNER_HIT;

  if (nearT && nearL) return 'tl';
  if (nearT && nearR) return 'tr';
  if (nearB && nearL) return 'bl';
  if (nearB && nearR) return 'br';
  if (nearL) return 'l';
  if (nearR) return 'r';
  if (nearT) return 't';
  if (nearB) return 'b';
  return 'move';
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

  const stageRef = useRef(null);
  const stagePageRef = useRef(null);
  const fittedRef = useRef(null);
  const cropRef = useRef(null);
  const dragStartRef = useRef(null);
  const modeRef = useRef('move');

  useEffect(() => {
    if (!visible || !uri) return;
    setNatural(null);
    setCrop(null);
    setLayout(null);
    setBusy(false);
    Image.getSize(
      uri,
      (width, height) => setNatural({ width, height }),
      () => setNatural(null)
    );
  }, [visible, uri]);

  useEffect(() => {
    if (!natural || !layout?.width || !layout?.height) {
      fittedRef.current = null;
      return;
    }
    const scale = Math.min(layout.width / natural.width, layout.height / natural.height);
    const width = natural.width * scale;
    const height = natural.height * scale;
    const left = (layout.width - width) / 2;
    const top = (layout.height - height) / 2;
    const fitted = { left, top, width, height, scale };
    fittedRef.current = fitted;

    const next = { x: left, y: top, w: width, h: height };
    cropRef.current = next;
    setCrop(next);
  }, [natural, layout]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        const finishGrant = () => {
          const current = cropRef.current;
          modeRef.current = hitMode(current, pageX, pageY, stagePageRef.current);
          dragStartRef.current = current ? { ...current } : null;
        };
        if (stageRef.current) {
          stageRef.current.measureInWindow((x, y) => {
            stagePageRef.current = { x, y };
            finishGrant();
          });
        } else {
          finishGrant();
        }
      },
      onPanResponderMove: (_evt, gesture) => {
        const fitted = fittedRef.current;
        const start = dragStartRef.current;
        if (!fitted || !start) return;

        const mode = modeRef.current;
        const dx = gesture.dx;
        const dy = gesture.dy;
        let { x, y, w, h } = start;

        if (mode === 'move') {
          x = clamp(start.x + dx, fitted.left, fitted.left + fitted.width - start.w);
          y = clamp(start.y + dy, fitted.top, fitted.top + fitted.height - start.h);
        } else {
          if (mode.includes('l')) {
            const nx = clamp(start.x + dx, fitted.left, start.x + start.w - MIN_CROP_PX);
            w = start.w - (nx - start.x);
            x = nx;
          }
          if (mode.includes('r')) {
            w = clamp(start.w + dx, MIN_CROP_PX, fitted.left + fitted.width - start.x);
          }
          if (mode.includes('t')) {
            const ny = clamp(start.y + dy, fitted.top, start.y + start.h - MIN_CROP_PX);
            h = start.h - (ny - start.y);
            y = ny;
          }
          if (mode.includes('b')) {
            h = clamp(start.h + dy, MIN_CROP_PX, fitted.top + fitted.height - start.y);
          }
        }

        cropRef.current = { x, y, w, h };
        setCrop({ x, y, w, h });
      },
    })
  ).current;

  const onStageLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
    stageRef.current?.measureInWindow((x, y) => {
      stagePageRef.current = { x, y };
    });
  };

  const handleApply = async () => {
    const fitted = fittedRef.current;
    const c = cropRef.current;
    if (!uri || !natural || !fitted || !c || busy) return;
    setBusy(true);
    try {
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
      <View style={[styles.cropModalRoot, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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

        <View
          ref={stageRef}
          style={styles.cropModalStage}
          onLayout={onStageLayout}
          {...panResponder.panHandlers}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.cropModalImage}
              resizeMode="contain"
              pointerEvents="none"
            />
          ) : null}

          {crop ? (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <View style={[styles.cropDim, { top: 0, left: 0, right: 0, height: crop.y }]} />
              <View
                style={[styles.cropDim, { top: crop.y + crop.h, left: 0, right: 0, bottom: 0 }]}
              />
              <View style={[styles.cropDim, { top: crop.y, left: 0, width: crop.x, height: crop.h }]} />
              <View
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
              >
                <View style={[styles.cropHandle, styles.cropHandleTL]} />
                <View style={[styles.cropHandle, styles.cropHandleTR]} />
                <View style={[styles.cropHandle, styles.cropHandleBL]} />
                <View style={[styles.cropHandle, styles.cropHandleBR]} />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
