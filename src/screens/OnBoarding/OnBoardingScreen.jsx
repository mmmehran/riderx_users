import React, {useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useDispatch} from 'react-redux';

import routes from '../../navigation/routes';
import colors from '../../config/colors';
import {
  Onboarding1,
  Onboarding2,
  Onboarding3,
  ArrowRight,
} from '../../../assets/svg/index';
import CustomText from '../../components/common/CustomText';
import {setSeeOnboarding} from '../../redux/reducers/configReducer';

const OnBoardingScreen = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const data = [
    {
      id: 1,
      name: t('onBoardingTitle1'),
      content: t('onBoardingContent1'),
      Icon: Onboarding1,
    },
    {
      id: 2,
      name: t('onBoardingTitle2'),
      content: t('onBoardingContent2'),
      Icon: Onboarding2,
    },
    {
      id: 3,
      name: t('onBoardingTitle3'),
      content: t('onBoardingContent3'),
      Icon: Onboarding3,
    },
  ];

  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const dispatch = useDispatch();

  const goTo = next => {
    Animated.timing(progress, {
      toValue: next,
      duration: 350,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    setIndex(next);
  };

  const onNext = () => {
    const next = index + 1;
    if (next < data.length) goTo(next);
    else {
      navigation.replace(routes.HOMEMAIN ?? routes.LOGIN ?? routes.AUTHMAIN);
    }
  };

  const PAGE = wp(100);

  const slideTop = i => {
    const translateX = progress.interpolate({
      inputRange: [i - 1, i, i + 1],
      outputRange: [-PAGE, 0, +PAGE],
      extrapolate: 'clamp',
    });
    const opacity = progress.interpolate({
      inputRange: [i - 0.6, i, i + 0.6],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });
    return {transform: [{translateX}], opacity};
  };

  const slideBottom = i => {
    const translateX = progress.interpolate({
      inputRange: [i - 1, i, i + 1],
      outputRange: [PAGE, 0, -PAGE],
      extrapolate: 'clamp',
    });
    const opacity = progress.interpolate({
      inputRange: [i - 0.6, i, i + 0.6],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });
    return {transform: [{translateX}], opacity};
  };

  const onDone = () => {
    dispatch(setSeeOnboarding());
    navigation.navigate(routes.MAINNAVIGATOR);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        style={{width: wp(100), height: hp(100)}}
        source={require('../../../assets/image/Onboarding.jpg')}>
        <View style={styles.top}>
          {data.map((it, i) => {
            const Icon = it.Icon;
            return (
              <Animated.View
                key={it.id}
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.topLayer,
                  slideTop(i),
                ]}>
                <Icon width={wp(100)} height={hp(50)} />
              </Animated.View>
            );
          })}
        </View>
        <View style={styles.bottom}>
          {data.map((it, i) => (
            <Animated.View
              key={it.id}
              style={[StyleSheet.absoluteFillObject, slideBottom(i)]}>
              <CustomText style={styles.text}>{it.name}</CustomText>
              <View style={styles.textContentContainer}>
                <CustomText style={styles.textContent}>{it.content}</CustomText>
              </View>
            </Animated.View>
          ))}
          <View style={styles.buttonContainer}>
            {index == 2 ? (
              <TouchableOpacity
                style={[styles.button, styles.donebutton]}
                onPress={onDone}
                activeOpacity={0.9}>
                <View style={[styles.buttonCenter, styles.doneButtonCenter]}>
                  <CustomText style={styles.doneText}>
                    {t('GetStarted')}
                  </CustomText>
                  <ArrowRight width={wp(4)} height={wp(4)} />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={onNext}
                activeOpacity={0.9}>
                <View style={styles.buttonCenter}>
                  <ArrowRight width={wp(4)} height={wp(4)} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default OnBoardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: colors.black,
  },
  top: {flex: 1, marginTop: hp(10), marginBottom: hp(5)},
  topLayer: {alignItems: 'center', justifyContent: 'flex-end'},
  bottom: {flex: 1},
  text: {
    fontSize: wp(10.5),
    color: colors.white,
    fontFamily: 'YaldeviJaffna-Bold',
    width: wp(70),
    marginLeft: wp(4),
    lineHeight: hp(5.5),
  },
  doneText: {
    fontSize: wp(4),
    color: colors.neutral900,
    fontFamily: 'YaldeviJaffna-Bold',
    marginRight: wp(2.5),
  },
  textContent: {
    fontSize: wp(4),
    color: colors.white,
    marginLeft: wp(4),
    lineHeight: hp(2.8),
    marginTop: hp(1),
  },
  button: {
    width: wp(17),
    height: wp(17),
    borderRadius: wp(20),
    borderWidth: wp(0.3),
    borderColor: colors.neonYellowLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donebutton: {
    borderWidth: wp(0),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonCenter: {
    width: wp(14.5),
    height: wp(14.5),
    borderRadius: wp(20),
    backgroundColor: colors.neonYellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonCenter: {
    width: wp(60),
    height: wp(12),
    borderRadius: wp(2.5),
    backgroundColor: colors.neonYellow,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonContainer: {alignItems: 'center', marginTop: hp(25)},
  textContentContainer: {height: hp(12)},
});
