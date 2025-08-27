import React, {memo, useRef, useEffect} from 'react';
import {StyleSheet, View, TouchableOpacity, Animated} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';

import CustomModal from '../components/common/CustomModal';
import colors from '../config/colors';
import CustomText from '../components/common/CustomText';
import {Line2, StarIcon} from '../../assets/svg/index';

const AcceptOrderModal = ({isVisible, onClose, onAccept, order}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  const {t} = useTranslation();

  useEffect(() => {
    if (isVisible) {
      progressAnim.setValue(0);
      animationRef.current = Animated.timing(progressAnim, {
        toValue: 1,
        duration: 10000, // 10 seconds
        useNativeDriver: false,
      });
      animationRef.current.start(() => {
        // Scenario 2: Auto-close after timeout → next order
        onClose?.();
      });
    } else {
      progressAnim.setValue(0);
    }
    return () => {
      animationRef.current?.stop();
    };
  }, [isVisible]);

  const handleAccept = () => {
    animationRef.current?.stop();
    progressAnim.setValue(1);
    // Scenario 3: Accept and stop showing more orders
    onAccept?.();
  };

  return (
    <CustomModal style={styles.modal} isVisible={isVisible} backdropOpacity={0}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.deliveryContainer}>
            <CustomText style={styles.textDelivery}>{t('delivery')}</CustomText>
          </View>
          {/* Scenario 1: Manual close → next order */}
          <TouchableOpacity onPress={onClose} style={styles.closeContainer}>
            <CustomText style={[styles.textDelivery, {fontSize: wp(5)}]}>
              x
            </CustomText>
          </TouchableOpacity>
        </View>

        <CustomText style={styles.textPrice}>{order?.rider_fee} €</CustomText>

        <View style={styles.starContainer}>
          <StarIcon />
          <CustomText style={styles.textStar}>-</CustomText>
        </View>

        <View style={styles.line}></View>

        <View style={styles.addressContainer}>
          <View style={styles.circle}>
            <Line2 />
          </View>
          <View>
            <CustomText style={styles.textTop}>- mins (- km) away</CustomText>
            <CustomText
              style={[
                styles.textTop,
                {color: 'rgba(70, 67, 67, 0.84)', marginTop: hp(0.3)},
              ]}>
              -
            </CustomText>

            <CustomText style={[styles.textTop, {marginTop: hp(4)}]}>
              - mins (- km) away
            </CustomText>
            <CustomText
              style={[
                styles.textTop,
                {color: 'rgba(70, 67, 67, 0.84)', marginTop: hp(0.3)},
              ]}>
              -
            </CustomText>
          </View>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            onPress={handleAccept} // Scenario 3
            style={styles.button}
            activeOpacity={1}>
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#E8B003',
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
            <CustomText style={styles.textButton}>Accept</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomModal>
  );
};

export default memo(AcceptOrderModal);

const styles = StyleSheet.create({
  container: {
    width: wp(84),
    height: hp(45),
    backgroundColor: colors.white,
    borderRadius: wp(3),
    borderWidth: wp(1),
    borderColor: '#FDE293',
  },
  textTop: {
    fontSize: wp(3.8),
    fontWeight: '900',
    marginLeft: wp(2),
    marginTop: hp(0.3),
  },
  textButton: {
    fontSize: wp(5.3),
    color: colors.black,
    fontWeight: '900',
    zIndex: 1,
  },
  circle: {
    width: wp(2),
    height: wp(2),
    backgroundColor: colors.black,
    borderRadius: wp(50),
    marginTop: hp(1),
  },
  addressContainer: {
    flexDirection: 'row',
    marginTop: hp(1),
    marginLeft: wp(7),
  },
  modal: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: hp(7),
  },
  headerContainer: {
    flexDirection: 'row',
    marginTop: hp(2),
    justifyContent: 'space-between',
  },
  deliveryContainer: {
    width: wp(26),
    height: hp(3.8),
    backgroundColor: 'rgba(251, 188, 4, 0.66)',
    justifyContent: 'center',
    borderRadius: wp(1),
    marginLeft: wp(3),
    paddingLeft: wp(2),
  },
  buttonWrapper: {
    overflow: 'hidden',
    borderRadius: wp(0.5),
    width: wp(75),
    height: hp(5.3),
    marginHorizontal: wp(3.5),
    marginTop: hp(2.5),
  },
  button: {
    flex: 1,
    backgroundColor: '#FDD35A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(0.5),
    position: 'relative',
    overflow: 'hidden',
  },
  textDelivery: {
    fontSize: wp(5.8),
    color: colors.black,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  textPrice: {
    fontSize: wp(10),
    color: colors.black,
    fontWeight: '900',
    marginLeft: wp(3),
    marginTop: hp(1.5),
  },
  closeContainer: {
    width: wp(8),
    height: wp(8),
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: wp(50),
    marginRight: wp(5),
  },
  starContainer: {
    width: wp(13),
    height: hp(2.5),
    backgroundColor: '#D9D9D98A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(5),
    marginTop: hp(0.5),
  },
  textStar: {
    fontSize: wp(3.5),
    color: colors.black,
    fontWeight: '900',
    marginLeft: wp(0.5),
  },
  line: {
    width: wp(74),
    height: wp(0.2),
    backgroundColor: '#00000094',
    marginTop: hp(3),
    marginHorizontal: wp(3.5),
  },
});
