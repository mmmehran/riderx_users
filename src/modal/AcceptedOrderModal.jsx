import React, {memo, useState} from 'react';
import {StyleSheet, View, TouchableOpacity, Linking, Alert} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import SwipeButton from 'rn-swipe-button';
import {useTranslation} from 'react-i18next';

import colors from '../config/colors';
import CustomText from '../components/common/CustomText';
import {
  MessageIcon,
  CallIcon,
  OpenMap,
  Message,
  PhoneCall,
} from '../../assets/svg/index';
import {openGoogleMaps} from '../utils/googleMapsNavigator';
import {isAndroid15Plus} from '../utils/helpers';

const AcceptedOrderModal = ({order, changeOrder, loading, insets}) => {
  const [showAddress, SetShowAddress] = useState(false);
  const {t} = useTranslation();

  const phoneNumber = `tel:${
    order?.status !== 'pickup'
      ? `+${order?.sender_phone?.country_code}${order?.sender_phone?.number}`
      : `+${order?.receiver_phone?.country_code}${order?.receiver_phone?.number}`
  }`;

  const makeCall = async () => {
    try {
      const supported = await Linking.canOpenURL(phoneNumber);
      if (supported) {
        await Linking.openURL(phoneNumber);
      } else {
        Alert.alert('Error', t('phoneNotSupport'));
      }
    } catch (err) {
      console.error('Failed to make call:', err);
    }
  };

  const phoneNumberSms = `sms:${
    order?.status !== 'pickup'
      ? `+${order?.sender_phone?.country_code}${order?.sender_phone?.number}`
      : `+${order?.receiver_phone?.country_code}${order?.receiver_phone?.number}`
  }?body=Hello, this is a test message!`;

  const sendSms = async () => {
    try {
      const supported = await Linking.canOpenURL(phoneNumberSms);
      if (supported) {
        await Linking.openURL(phoneNumberSms);
      } else {
        Alert.alert('Error', t('smsNotSupport'));
      }
    } catch (err) {
      console.error('Failed to send SMS:', err);
    }
  };

  return (
    <View style={styles.modal}>
      <View
        style={[
          styles.container,
          isAndroid15Plus && {
            bottom: hp(insets.bottom * 0.18),
          },
        ]}>
        <View style={styles.userContainer}>
          <CustomText style={styles.text} numberOfLines={1}>
            {order?.status !== 'pickup'
              ? order?.sender_full_name
              : order?.receiver_full_name}
          </CustomText>
        </View>
        <View
          style={[
            styles.userContainer,
            {flexDirection: 'column', marginTop: hp(0.5)},
          ]}>
          <View style={styles.textContainer}>
            <CustomText
              style={styles.textInfo}
              numberOfLines={showAddress ? 10 : 2}>
              {t('address')}:{' '}
              {order?.status !== 'pickup'
                ? order?.sender_address_json?.full_address
                : order?.receiver_address_json?.full_address}
            </CustomText>
            <TouchableOpacity onPress={() => SetShowAddress(!showAddress)}>
              <CustomText style={styles.moreText}>
                {!showAddress ? t('moreInfo') : t('lessInfo')}
              </CustomText>
            </TouchableOpacity>
            {showAddress && (
              <>
                <CustomText style={styles.textInfo}>
                  {t('postalCode')} :{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.postal_code
                    : order?.receiver_address_json?.postal_code}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  {t('houseNumber')}:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.house_number
                    : order?.receiver_address_json?.house_number}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  {t('Entrance')}:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.entrance
                    : order?.receiver_address_json?.entrance}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  {t('Floor')} :{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.floor
                    : order?.receiver_address_json?.floor}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  {t('Door')}:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.apartment_door
                    : order?.receiver_address_json?.apartment_door}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  {t('Extradetails')}:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.address_extra_details
                    : order?.receiver_address_json?.address_extra_details}
                </CustomText>
                <CustomText style={styles.textType}>
                  {t('PackageType')}: {order?.delivery_package?.title}
                </CustomText>
                <View style={styles.iconContainer}>
                  {order?.status == 'pickup' &&
                    order?.receiver_phone?.number && (
                      <>
                        <TouchableOpacity
                          onPress={sendSms}
                          style={styles.buttonIcon}>
                          <Message width={wp(7)} height={wp(7)} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={makeCall}
                          style={styles.buttonIcon}>
                          <PhoneCall width={wp(7)} height={wp(7)} />
                        </TouchableOpacity>
                      </>
                    )}
                  {order?.status == 'accepted' &&
                    order?.sender_phone?.number && (
                      <>
                        <TouchableOpacity
                          onPress={sendSms}
                          style={styles.buttonIcon}>
                          <Message width={wp(7)} height={wp(7)} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={makeCall}
                          style={styles.buttonIcon}>
                          <PhoneCall width={wp(7)} height={wp(7)} />
                        </TouchableOpacity>
                      </>
                    )}
                  <TouchableOpacity
                    onPress={() => {
                      openGoogleMaps({
                        lat:
                          order?.status !== 'pickup'
                            ? order.sender_latitude
                            : order.receiver_latitude,
                        lng:
                          order?.status !== 'pickup'
                            ? order.sender_longitude
                            : order.receiver_longitude,
                        label: 'Pickup #1024',
                        mode: 'd',
                      });
                    }}
                    style={styles.buttonIcon}>
                    <OpenMap width={wp(8.5)} height={wp(8.5)} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
        <View style={styles.rowButton}>
          {order?.status == 'accepted' && (
            <SwipeButton
              title={t('PickedUp')}
              titleColor="#fff"
              height={hp(5.5)}
              titleFontSize={wp(4.3)}
              onSwipeSuccess={() => changeOrder('pickup', false)}
              width={wp(60)}
              railBackgroundColor="#303030ff"
              railBorderColor="#303030ff"
              railFillBackgroundColor="#ffe71046"
              railFillBorderColor="#303030ff"
              thumbIconBackgroundColor="#EFF65C"
              thumbIconBorderColor="#303030ff"
            />
          )}
          {order?.status == 'pickup' && (
            <SwipeButton
              title={t('dropOff')}
              titleColor="#fff"
              height={hp(5.5)}
              titleFontSize={wp(4)}
              onSwipeSuccess={() => {
                if (order?.is_secure) {
                  changeOrder('completed', true);
                } else {
                  changeOrder('completed', false);
                }
              }}
              width={wp(60)}
              shouldResetAfterSuccess
              railBackgroundColor="#303030ff"
              railBorderColor="#303030ff"
              railFillBackgroundColor="#ffe71046"
              railFillBorderColor="#303030ff"
              thumbIconBackgroundColor="#EFF65C"
              thumbIconBorderColor="#303030ff"
            />
          )}
          <TouchableOpacity
            onPress={() => changeOrder('cancel', false)}
            style={[styles.buttonPick, styles.cancelButton]}>
            <CustomText
              style={[styles.textPick, {color: colors.white, marginLeft: 0}]}>
              Cancel
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default memo(AcceptedOrderModal);

const styles = StyleSheet.create({
  container: {
    width: wp(95),
    backgroundColor: '#3030309a',
    borderRadius: wp(6),
    position: 'absolute',
    bottom: hp(3),
    paddingBottom: hp(1),
    borderWidth: wp(0.5),
    borderColor: '#303030ff',
  },
  moreText: {
    color: '#000000ff',
    fontWeight: 'bold',
    fontSize: wp(4.5),
    marginVertical: hp(0.5),
    marginBottom: hp(1.5),
  },
  rowButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    width: wp(25),
    marginLeft: wp(1),
    backgroundColor: '#ff8800ff',
    borderRadius: wp(20),
  },
  modal: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: hp(7),
  },
  imageContainer: {
    width: wp(17),
    height: wp(17),
    borderRadius: wp(50),
    backgroundColor: '#EFF65C',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.3),
    marginHorizontal: wp(5),
  },
  text: {
    color: '#EFF65C',
    fontWeight: '900',
    fontSize: wp(5),
    width: wp(85),
  },
  textInfo: {
    fontSize: wp(5),
    color: colors.white,
    fontWeight: '600',
  },
  iconContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp(0.5),
  },
  buttonIcon: {
    width: wp(15),
    height: wp(15),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
    borderRadius: wp(50),
    backgroundColor: '#EFF65C',
    marginHorizontal: wp(4),
    borderWidth: wp(0.5),
    borderColor: '#303030ff',
  },
  textContainer: {
    flex: 2,
  },
  textType: {
    color: colors.white,
    fontWeight: '900',
    fontSize: wp(5),
    marginBottom: hp(2),
  },
  buttonPick: {
    width: wp(60),
    height: hp(5.8),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(4.5),
    backgroundColor: '#EFF65C',
    flexDirection: 'row-reverse',
  },
  textPick: {
    color: colors.black,
    fontWeight: '900',
    fontSize: wp(4.3),
    marginLeft: wp(3),
  },
});
