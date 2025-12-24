import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

import colors from '../../config/colors';

const SWITCH_W = wp(13);
const SWITCH_H = hp(3.3);
const KNOB = hp(2.5);
const DOT = hp(0.9);
const PADDING = (SWITCH_H - KNOB) / 2;
const TRAVEL = SWITCH_W - KNOB - PADDING * 2;

const AvailabilityToggle = ({ value = true , onChange }) => {
  const { t } = useTranslation();
  const [isOn, setIsOn] = useState(!!value);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    setIsOn(!!value);
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 100, useNativeDriver: false }).start();
  }, [value, anim]);

  const onToggle = () => {
    const next = !isOn;
    setIsOn(next);
    Animated.timing(anim, { toValue: next ? 1 : 0, duration: 100, useNativeDriver: false }).start();
    onChange && onChange(next);
  };

  const pillBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E1E4EA', colors.neutral900],
  });
  const knobX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] });
  const leftColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neonTeal400, colors.neutral400],
  });
  const rightColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral400, colors.neonTeal400],
  });
  // fontWeight must be strings in RN
  const leftWeight = anim.interpolate({ inputRange: [0, 1], outputRange: ['700', '500'] });
  const rightWeight = anim.interpolate({ inputRange: [0, 1], outputRange: ['500', '700'] });

  return (
    <View style={styles.row}>
      <Animated.Text style={[styles.sideText, { color: leftColor }]}>
        {t('Unavailable')}
      </Animated.Text>

      <TouchableOpacity activeOpacity={0.9} onPress={onToggle}>
        <Animated.View style={[styles.switch, { backgroundColor: pillBg }]}>
          <Animated.View style={[styles.knob, { transform: [{ translateX: knobX }] }]}>
            <View style={styles.dot} />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      <Animated.Text style={[styles.sideText, { color: rightColor }]}>
        {t('Available') }
      </Animated.Text>
    </View>
  );
};

export default function CustomBottomTab({ style, onAvailabilityChange,toggleValue }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.center}>
        <AvailabilityToggle onChange={onAvailabilityChange} value={toggleValue}/>
      </View>
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft:wp(1.5),
    backgroundColor: colors.white,
    alignItems: 'flex-start',
    marginVertical:hp(1)
  },
  left: { justifyContent: 'center', alignItems: 'center', width: wp(20) },
  center: { justifyContent: 'center', alignItems: 'center' },

  row: { flexDirection: 'row', alignItems: 'center' },
  sideText: { fontSize: wp(4.2), marginHorizontal: wp(3),
        fontFamily: "YaldeviJaffna-Bold",
   },

  switch: {
    width: SWITCH_W,
    height: SWITCH_H,
    borderRadius: SWITCH_H / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.neutral900,
  },
});
