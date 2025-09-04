import React, {memo} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import colors from '../config/colors';
import CustomText from '../components/common/CustomText';
import {MessageIcon, CallIcon, OpenMap} from '../../assets/svg/index';
import {openGoogleMaps} from '../utils/googleMapsNavigator';
import {isAndroid15Plus} from '../utils/helpers';

const AcceptedOrderModal = ({order, changeOrder, loading, insets}) => {
  const phoneNumber = `tel:${
    order?.status !== 'pickup'
      ? order?.sender_phone?.number
      : order?.receiver_phone?.number
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
      ? order?.sender_phone?.number
      : order?.receiver_phone?.number
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
          <View style={styles.imageContainer}></View>
          <CustomText style={styles.text} numberOfLines={1}>
            {order?.status !== 'pickup'
              ? order?.sender_full_name
              : order?.receiver_full_name}
          </CustomText>
        </View>
        <View style={[styles.userContainer, {marginTop: hp(1)}]}>
          <View style={styles.textContainer}>
            <CustomText style={styles.textInfo}>
              Number:{' '}
              {order?.status !== 'pickup'
                ? order?.sender_address_json?.entrance
                : order?.receiver_address_json?.entrance}
            </CustomText>
            <CustomText style={styles.textInfo}>
              Door:{' '}
              {order?.status !== 'pickup'
                ? order?.sender_address_json?.apartment_door
                : order?.receiver_address_json?.apartment_door}
            </CustomText>
            <CustomText style={styles.textInfo}>
              Floor:{' '}
              {order?.status !== 'pickup'
                ? order?.sender_address_json?.floor
                : order?.receiver_address_json?.floor}
            </CustomText>
            <CustomText numberOfLines={3} style={styles.textInfo}>
              Extra details:{' '}
              {order?.status !== 'pickup'
                ? order?.sender_address_json?.address_extra_details
                : order?.receiver_address_json?.address_extra_details}
            </CustomText>
          </View>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={sendSms} style={styles.buttonIcon}>
              <MessageIcon />
            </TouchableOpacity>
            <TouchableOpacity onPress={makeCall} style={styles.buttonIcon}>
              <CallIcon />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={[
            styles.userContainer,
            {justifyContent: 'space-between', marginTop: hp(0)},
          ]}>
          <CustomText style={styles.textType}>
            Package Type: {order?.delivery_package?.title}
          </CustomText>
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
            <TouchableOpacity
              onPress={() => changeOrder('pickup')}
              style={styles.buttonPick}>
              <CustomText style={styles.textPick}>Picked Up</CustomText>
              {loading && <ActivityIndicator color={'#000'} />}
            </TouchableOpacity>
          )}
          {order?.status == 'pickup' && (
            <TouchableOpacity
              onPress={() => changeOrder('completed')}
              style={styles.buttonPick}>
              <CustomText style={styles.textPick}>Drop Off</CustomText>
              {loading && <ActivityIndicator color={'#000'} />}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => changeOrder('cancel')}
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
    height: hp(44),
    backgroundColor: '#B3B7C9B2',
    borderRadius: wp(3),
    position: 'absolute',
    bottom: hp(3),
  },
  rowButton: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    width: wp(25),
    marginLeft: wp(3),
    backgroundColor: colors.red,
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
    marginLeft: wp(5),
    width: wp(55),
  },
  textInfo: {
    fontSize: wp(5),
    color: colors.black,
    fontWeight: '600',
  },
  iconContainer: {
    flex: 1,
    alignItems: 'flex-end',
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
  },
  buttonPick: {
    width: wp(60),
    height: hp(5),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(4.5),
    backgroundColor: '#EFF65C',
    marginTop: hp(1),
    flexDirection: 'row-reverse',
  },
  textPick: {
    color: colors.black,
    fontWeight: '900',
    fontSize: wp(4.5),
    marginLeft: wp(3),
  },
});
