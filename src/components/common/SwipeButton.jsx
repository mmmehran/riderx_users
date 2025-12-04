import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  withTiming,
} from 'react-native-reanimated';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import colors from '../../config/colors';
import {IconButton} from '../../../assets/svg/index';

const SwipeButton = ({
  onSwipeSuccess,
  title = 'Accept',
  height = 60,
  width = wp(73.5),
  thumbSize = 50,
  railBackgroundColor = colors.black,
  thumbBackgroundColor = colors.neonYellow,
  titleColor = '#fff',
}) => {
  const [swiped, setSwiped] = useState(false);
  const X = useSharedValue(0);
  const H_PADDING = 5; // Padding inside the rail
  const SWIPE_RANGE = width - thumbSize - H_PADDING * 2;

  const handleComplete = () => {
    setSwiped(true);
    if (onSwipeSuccess) {
      onSwipeSuccess();
    }
  };

  const pan = Gesture.Pan()
    .onUpdate(e => {
      if (swiped) return;
      let newValue = e.translationX;
      if (newValue < 0) newValue = 0;
      if (newValue > SWIPE_RANGE) newValue = SWIPE_RANGE;
      X.value = newValue;
    })
    .onEnd(() => {
      if (swiped) return;
      if (X.value > SWIPE_RANGE * 0.7) {
        X.value = withSpring(SWIPE_RANGE, {damping: 20, stiffness: 200}, () => {
          runOnJS(handleComplete)();
        });
      } else {
        X.value = withSpring(0);
      }
    });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: X.value}],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        X.value,
        [0, SWIPE_RANGE / 2],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const animatedRailStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: railBackgroundColor,
    };
  });

  return (
    <View style={[styles.container, {width, height}]}>
      <Animated.View
        style={[
          styles.rail,
          animatedRailStyle,
          {borderRadius: wp(3.5)},
        ]}>
        <Animated.Text style={[styles.text, animatedTextStyle, {color: titleColor}]}>
          {title}
        </Animated.Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.thumb,
            animatedThumbStyle,
            {
              height: thumbSize,
              width: thumbSize,
              backgroundColor: thumbBackgroundColor,
              borderRadius: wp(2),
              left: H_PADDING,
              top: (height - thumbSize) / 2,
            },
          ]}>
          <IconButton width={thumbSize * 0.6} height={thumbSize * 0.6} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    position: 'relative',
  },
  rail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  text: {
    fontWeight: 'bold',
    fontSize: wp(4),
    fontFamily: 'arial',
  },
});

export default SwipeButton;
