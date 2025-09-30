import React, {memo, useState} from 'react';
import {StyleSheet, View, TouchableOpacity, Linking, Alert} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import SwipeButton from 'rn-swipe-button';

import colors from '../config/colors';
import CustomText from '../components/common/CustomText';
import {MessageIcon, CallIcon, OpenMap} from '../../assets/svg/index';
import {openGoogleMaps} from '../utils/googleMapsNavigator';
import {isAndroid15Plus} from '../utils/helpers';

const AcceptedOrderModal = ({order, changeOrder, loading, insets}) => {
  const [showAddress, SetShowAddress] = useState(false);

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
        Alert.alert('Error', 'Phone call not supported on this device');
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
        Alert.alert('Error', 'SMS not supported on this device');
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
        <View style={[styles.userContainer, {flexDirection: 'column'}]}>
          <View style={styles.textContainer}>
            <CustomText style={styles.textInfo}>
              Address:{' '}
              {order?.status !== 'pickup'
                ? order?.sender_address_json?.full_address
                : order?.receiver_address_json?.full_address}
            </CustomText>
            <TouchableOpacity onPress={() => SetShowAddress(!showAddress)}>
              <CustomText style={styles.moreText}>
                {!showAddress ? 'More info' : 'Less info'}
              </CustomText>
            </TouchableOpacity>
            {showAddress && (
              <>
                <CustomText style={styles.textInfo}>
                  Postal code:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.postal_code
                    : order?.receiver_address_json?.postal_code}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  House Number:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.house_number
                    : order?.receiver_address_json?.house_number}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  Entrance:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.entrance
                    : order?.receiver_address_json?.entrance}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  Floor:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.floor
                    : order?.receiver_address_json?.floor}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  Door:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.apartment_door
                    : order?.receiver_address_json?.apartment_door}
                </CustomText>
                <CustomText style={styles.textInfo}>
                  Extra details:{' '}
                  {order?.status !== 'pickup'
                    ? order?.sender_address_json?.address_extra_details
                    : order?.receiver_address_json?.address_extra_details}
                </CustomText>
                <CustomText style={styles.textType}>
                  Package Type: {order?.delivery_package?.title}
                </CustomText>
              </>
            )}
          </View>
        </View>
        <View style={styles.iconContainer}>
          {order?.status == 'pickup' && order?.receiver_phone?.number && (
            <>
              <TouchableOpacity onPress={sendSms} style={styles.buttonIcon}>
                <MessageIcon />
              </TouchableOpacity>
              <TouchableOpacity onPress={makeCall} style={styles.buttonIcon}>
                <CallIcon />
              </TouchableOpacity>
            </>
          )}
          {order?.status == 'accepted' && order?.sender_phone?.number && (
            <>
              <TouchableOpacity onPress={sendSms} style={styles.buttonIcon}>
                <MessageIcon />
              </TouchableOpacity>
              <TouchableOpacity onPress={makeCall} style={styles.buttonIcon}>
                <CallIcon />
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
            <OpenMap width={wp(12)} height={wp(12)} />
          </TouchableOpacity>
        </View>
        <View style={styles.rowButton}>
          {order?.status == 'accepted' && (
            <SwipeButton
              title="Picked Up"
              titleColor="#fff"
              height={hp(5.5)}
              titleFontSize={wp(4.3)}
              onSwipeSuccess={() => changeOrder('pickup', false)}
              width={wp(60)}
              railBackgroundColor="#303030ff"
              railBorderColor="#303030ff"
              railFillBackgroundColor="#ffe71046"
              railFillBorderColor="#303030ff"
              thumbIconBackgroundColor="#FFE710"
              thumbIconBorderColor="#303030ff"
            />
          )}
          {order?.status == 'pickup' && (
            <SwipeButton
              title="Drop Off"
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
              thumbIconBackgroundColor="#FFE710"
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
    backgroundColor: '#B3B7C9B2',
    borderRadius: wp(3),
    position: 'absolute',
    bottom: hp(3),
    paddingBottom: hp(2),
  },
  moreText: {
    color: colors.blue,
    fontWeight: 'bold',
    fontSize: wp(4.5),
    marginVertical: hp(1),
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
    marginTop: hp(2),
    marginHorizontal: wp(5),
  },
  text: {
    color: colors.black,
    fontWeight: '900',
    fontSize: wp(5),
    width: wp(55),
  },
  textInfo: {
    fontSize: wp(5),
    color: colors.black,
    fontWeight: '600',
  },
  iconContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp(1),
  },
  buttonIcon: {
    width: wp(18),
    height: wp(15),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  textContainer: {
    flex: 2,
  },
  textType: {
    color: colors.black,
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
