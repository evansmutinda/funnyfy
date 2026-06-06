import React, { useState, useMemo } from 'react';
import { View, Image, Text, PanResponder } from 'react-native';
import styles from '../styles';

export default function CompareSlider({ originalUri, resultUri }) {
  const [mix, setMix] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
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
    <View
      style={styles.previewCanvas}
      onLayout={(e) => setCanvasWidth(e.nativeEvent.layout.width)}
    >
      {resultUri ? (
        <Image source={{ uri: resultUri }} style={styles.previewImage} resizeMode="cover" />
      ) : null}
      {originalUri ? (
        <View style={[styles.afterMask, { width: `${mix * 100}%` }]}>
          <Image source={{ uri: originalUri }} style={styles.previewImage} resizeMode="cover" />
        </View>
      ) : null}
      {/* Visible slider handle */}
      {canvasWidth > 0 && (
        <View pointerEvents="none" style={styles.sliderHandleContainer}>
          <View
            style={[
              styles.sliderLine,
              { left: canvasWidth * mix - 1 }, // center vertical divider
            ]}
          />
          <View
            style={[
              styles.sliderKnob,
              { left: canvasWidth * mix - 16 }, // knob centered on line
            ]}
          >
            <Text style={styles.sliderKnobText}>‹›</Text>
          </View>
        </View>
      )}
      <View style={styles.previewOverlay} {...panResponder.panHandlers} />
    </View>
  );
}
