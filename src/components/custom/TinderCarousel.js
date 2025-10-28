// components/TinderCarousel.js
import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const OFFSCREEN_X = SCREEN_W * 1.2;

function CardLayer({
  item,
  idx,
  layer,
  isTop,
  cardWidth,
  cardHeight,
  tx,
  ty,
  rot,
  stackScale,
  stackOffset,
  swipeGesture,
  renderItem,
}) {
  // ✅ Recompute when isTop/layer/stackScale/stackOffset change
  const style = useAnimatedStyle(
    () => {
      if (isTop) {
        return {
          transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { rotateZ: `${rot.value}deg` },
            { scale: 1 },
          ],
        };
      }
      const s = Math.pow(stackScale, layer);
      const y =
        -stackOffset * layer +
        interpolate(
          Math.abs(tx.value),
          [0, SWIPE_THRESHOLD, SCREEN_W],
          [0, -stackOffset * 0.2 * layer, -stackOffset * 0.35 * layer],
          Extrapolate.CLAMP
        );

      return {
        transform: [{ translateY: y }, { scale: s }],
        opacity: interpolate(Math.abs(tx.value), [0, SWIPE_THRESHOLD], [1, 0.96]),
      };
    },
    // ← dependencies that are normal JS values used inside the worklet
    [isTop, layer, stackScale, stackOffset]
  );

  const body = (
    <Animated.View
      style={[
        styles.card,
        // deck container controls width; card stretches to 100%
        { height: cardHeight, zIndex: 100 - layer },
        style,
      ]}
    >
      {renderItem({ item, index: idx })}
    </Animated.View>
  );

  return isTop ? (
    <GestureDetector gesture={swipeGesture}>{body}</GestureDetector>
  ) : (
    body
  );
}

export default function TinderCarousel({
  data,
  renderItem,
  cardWidth = SCREEN_W * 0.94,
  cardHeight = SCREEN_H * 0.48,
  stackCount = 3,
  stackScale = 0.94,
  stackOffset = 14,
  onIndexChange,
  onSwipe, // (item, dir)
}) {
  const index = useSharedValue(0);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);

  const [, setTick] = useState(0);
  const bump = () => setTick(t => t + 1);

  const clampIndex = useCallback(
    i => Math.min(Math.max(0, i), data.length),
    [data.length]
  );

  const advance = useCallback(
    dir => {
      index.value = clampIndex(index.value + 1);
      tx.value = 0;
      ty.value = 0;
      rot.value = 0;
      onIndexChange?.(index.value);
      bump();
    },
    [clampIndex, index, tx, ty, rot, onIndexChange]
  );

  const handleSwipeJS = useCallback(
    (i, dir) => {
      const item = data[i];
      if (item) onSwipe?.(item, dir);
      advance(dir);
    },
    [data, onSwipe, advance]
  );

  const pan = Gesture.Pan()
    .onChange(e => {
      tx.value += e.changeX;
      ty.value += e.changeY;
      rot.value = interpolate(tx.value, [-SCREEN_W, SCREEN_W], [-12, 12], Extrapolate.CLAMP);
    })
    .onEnd(() => {
      const dir = tx.value > 0 ? 'right' : 'left';
      const absX = Math.abs(tx.value);

      if (absX > SWIPE_THRESHOLD) {
        const finalX = dir === 'right' ? OFFSCREEN_X : -OFFSCREEN_X;
        tx.value = withTiming(finalX, { duration: 180 }, finished => {
          if (finished) runOnJS(handleSwipeJS)(index.value, dir);
        });
        ty.value = withTiming(ty.value * 0.2, { duration: 180 });
        rot.value = withTiming(dir === 'right' ? 16 : -16, { duration: 180 });
      } else {
        tx.value = withSpring(0, { mass: 0.7, damping: 14, stiffness: 140 });
        ty.value = withSpring(0, { mass: 0.7, damping: 14, stiffness: 140 });
        rot.value = withSpring(0);
      }
    });

  const stackItems = useMemo(() => {
    const start = Math.floor(index.value);
    const out = [];
    for (let i = 0; i < stackCount; i++) {
      const idx = start + i;
      if (idx >= data.length) break;
      out.push({ item: data[idx], idx, layer: i });
    }
    return out;
  }, [data, stackCount, index.value]);

  return (
    // ✅ Container sets exact width; cards stretch to 100%
    <View style={[styles.root, { height: cardHeight, width: cardWidth }]}>
      {stackItems
        .slice()
        .reverse()
        .map(({ item, idx, layer }) => (
          <CardLayer
            key={idx}
            item={item}
            idx={idx}
            layer={layer}
            isTop={layer === 0}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            tx={tx}
            ty={ty}
            rot={rot}
            stackScale={stackScale}
            stackOffset={stackOffset}
            swipeGesture={pan}
            renderItem={renderItem}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    // Important: let children stretch horizontally to container width
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,        // <-- width = 100% of container
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#42424291',
  },
});
