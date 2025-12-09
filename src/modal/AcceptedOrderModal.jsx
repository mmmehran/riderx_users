import React, { memo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import SwipeButton from '../components/common/SwipeButton';
import { useTranslation } from 'react-i18next';

import colors from '../config/colors';
import CustomText from '../components/common/CustomText';
import {
  ArrowUp,
  CancelIcon,
  TinyProfile,
  PhoneIcon,
  PinLocation,
  ClockIcon,
  MessageIcon1,
  MapIcon
} from '../../assets/svg/index';
import { normalizeLabel, timeAgoShort, isAndroid15Plus } from '../utils/helpers';
import { openExternalMap } from '../utils/externalMap';
import { useSelector } from 'react-redux';
import { selectConfig } from '../redux/reducers/configReducer';


const AcceptedOrderModal = ({ order, changeOrder, loading, insets, onModalPosition }) => {
  const { t } = useTranslation();
  const [less, setLess] = useState(false);
  const config = useSelector(selectConfig);

  const phoneNumber = `tel:${order?.status !== 'pickup'
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




  const phoneNumberSms = `sms:${order?.status !== 'pickup'
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

  const openMaps = async () => {
    const lat =
      order?.status !== 'pickup'
        ? order?.sender_latitude
        : order?.receiver_latitude;
    const lng =
      order?.status !== 'pickup'
        ? order?.sender_longitude
        : order?.receiver_longitude;
    const label = order?.status !== 'pickup' ? 'Pickup' : 'Dropoff';

    // default: iOS -> apple, Android -> google
    const app =
      config?.externalMap ||
      (Platform.OS === 'ios' ? 'apple' : 'google');

    if (!lat || !lng) {
      Alert.alert('Error', 'Location coordinates not available.');
      return;
    }

    try {
      await openExternalMap(app, lat, lng, label);
    } catch (err) {
      console.error('Failed to open map:', err);
      Alert.alert('Error', t('mapAppNotInstalled', { app }));
    }
  };


  return (
    <View style={styles.modal}>
      <View
        style={[styles.container, isAndroid15Plus && { marginBottom: hp(6) }]}>
        <View style={styles.userContainer}>
          <View style={styles.imageContainer}></View>
          <View>
            <CustomText style={styles.text} numberOfLines={1}>
              {order?.sender?.first_name + ' ' + order?.sender?.last_name}
            </CustomText>
            <View style={styles.rowTime}>
              <ClockIcon width={wp(4.4)} height={wp(4.4)}></ClockIcon>
              <CustomText style={styles.textTime}>
                {timeAgoShort(order?.timestamp)}
              </CustomText>
            </View>
          </View>
          <TouchableOpacity
            onPress={sendSms}
            style={[
              styles.buttonCall1,
              { backgroundColor: colors.black, marginRight: wp(2) },
            ]}>
            <MessageIcon1 width={wp(5)} height={wp(5)}></MessageIcon1>
          </TouchableOpacity>
          <TouchableOpacity onPress={makeCall} style={styles.buttonCall1}>
            <PhoneIcon width={wp(5)} height={wp(5)}></PhoneIcon>
          </TouchableOpacity>
        </View>
        <View style={styles.rowStreet}>
          <PinLocation width={wp(4)} height={wp(4)}></PinLocation>
          <View style={[styles.rowText, { marginLeft: wp(0.9) }]}>
            <CustomText style={styles.textInfo1}>{t('address')}:</CustomText>
            <CustomText style={styles.textInfo} numberOfLines={10}>
              {(order?.status !== 'pickup'
                ? order?.sender_address_json?.street
                : order?.receiver_address_json?.street) ?? '-'}
            </CustomText>
          </View>
        </View>
        {!less && (
          <>
            <View style={styles.addressContainer}>
              <View style={styles.rowTextContainer}>
                <View style={styles.rowText}>
                  <CustomText style={styles.textInfo1}>
                    {t('postalCode')}:
                  </CustomText>
                  <CustomText style={styles.textInfo}>
                    {(order?.status !== 'pickup'
                      ? order?.sender_address_json?.postal_code
                      : order?.receiver_address_json?.postal_code) ?? '-'}
                  </CustomText>
                </View>
                <View style={styles.rowText}>
                  <CustomText style={styles.textInfo1}>
                    {t('houseNumber')}:
                  </CustomText>
                  <CustomText style={styles.textInfo}>
                    {(order?.status !== 'pickup'
                      ? order?.sender_address_json?.house_number
                      : order?.receiver_address_json?.house_number) ?? '-'}
                  </CustomText>
                </View>
                <View style={styles.rowText}>
                  <CustomText style={styles.textInfo1}>
                    {t('Entrance')}:
                  </CustomText>
                  <CustomText style={styles.textInfo}>
                    {(order?.status !== 'pickup'
                      ? order?.sender_address_json?.entrance
                      : order?.receiver_address_json?.entrance) ?? '-'}
                  </CustomText>
                </View>
                <View style={styles.rowText}>
                  <CustomText style={styles.textInfo1}>
                    {t('Floor')}:
                  </CustomText>
                  <CustomText style={styles.textInfo}>
                    {(order?.status !== 'pickup'
                      ? order?.sender_address_json?.floor
                      : order?.receiver_address_json?.floor) ?? '-'}
                  </CustomText>
                </View>
                <View style={styles.rowText}>
                  <CustomText style={styles.textInfo1}>{t('Door')}:</CustomText>
                  <CustomText style={styles.textInfo}>
                    {(order?.status !== 'pickup'
                      ? order?.sender_address_json?.apartment_door
                      : order?.receiver_address_json?.apartment_door) ?? '-'}
                  </CustomText>
                </View>
                <View style={styles.rowText}>
                  <CustomText style={styles.textInfo1}>
                    {t('Extradetails')}:
                  </CustomText>
                  <CustomText style={[styles.textInfo, { width: wp(70), lineHeight: hp(2.5) }]}>
                    {(order?.status !== 'pickup'
                      ? order?.sender_address_json?.address_extra_details
                      : order?.receiver_address_json?.address_extra_details) ??
                      '-'}
                  </CustomText>
                </View>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", marginRight: wp(3), marginBottom: hp(1.5) }}>
              <TouchableOpacity onPress={openMaps} style={[styles.buttonCall, { backgroundColor: colors.black }]}>
                <MapIcon width={wp(5)} height={wp(5)}></MapIcon>
              </TouchableOpacity>
            </View>
            {order?.status == 'accepted' && order?.sender_phone?.number && (
              <View style={{ flexDirection: "row" }}>
                <View style={styles.row}>
                  <View style={[styles.row, { marginBottom: 0 }]}>
                    <TinyProfile width={wp(4.5)} height={wp(4.5)}></TinyProfile>
                    <CustomText style={styles.textReciever} numberOfLines={1}>
                      {order?.sender_full_name}
                    </CustomText>
                  </View>
                  <TouchableOpacity onPress={makeCall} style={styles.buttonCall}>
                    <PhoneIcon></PhoneIcon>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {order?.status == 'pickup' && order?.receiver_phone?.number && (
              <View style={{ flexDirection: "row" }}>
                <View style={styles.row}>
                  <View style={[styles.row, { marginBottom: 0 }]}>
                    <TinyProfile width={wp(4.5)} height={wp(4.5)}></TinyProfile>
                    <CustomText style={styles.textReciever} numberOfLines={1}>
                      {order?.receiver_full_name}
                    </CustomText>
                  </View>
                  <TouchableOpacity onPress={makeCall} style={styles.buttonCall}>
                    <PhoneIcon></PhoneIcon>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
        <TouchableOpacity
          onPress={() => {
            setLess(!less)
            onModalPosition(!less)
          }}
          style={styles.lessContainer}>
          <CustomText style={styles.textLess}>
            {less ? t('moreInfo') : t('lessInfo')}
          </CustomText>
          <ArrowUp width={wp(5.5)} height={wp(5.5)}></ArrowUp>
        </TouchableOpacity>
        <View
          style={[
            styles.line,

            (order?.tags?.length ||
              order?.need_special_equipment ||
              order?.is_secure) && { marginBottom: hp(0) },
          ]}
        />
        {(order?.tags?.length ||
          order?.need_special_equipment ||
          order?.is_secure) && (
            <View style={styles.tagContainer}>
              {order?.tags?.map(item => {
                return (
                  <View style={styles.tagBox}>
                    <CustomText style={styles.textTag}>
                      {normalizeLabel(item)}
                    </CustomText>
                  </View>
                );
              })}
              {order?.need_special_equipment && (
                <View style={styles.tagBox}>
                  <CustomText style={styles.textTag}>
                    {normalizeLabel(order?.need_special_equipment)}
                  </CustomText>
                </View>
              )}
              {order?.is_secure && (
                <View style={styles.tagBox}>
                  <CustomText style={styles.textTag}>{t('isSecure')}</CustomText>
                </View>
              )}
            </View>
          )}
        <View style={styles.rowButton}>
          {order?.status == 'accepted' && (
            <SwipeButton
              title={t('PickedUp')}
              onSwipeSuccess={() => changeOrder('pickup', false)}
              height={Math.max(hp(5), 55)}
              width={wp(77)}
              thumbSize={Math.max(wp(5), 45)}
              railBackgroundColor={colors.white}
              thumbBackgroundColor={colors.black}
              titleColor={colors.black}
            />
          )}
          {order?.status == 'pickup' && (
            <SwipeButton
              title={t('dropOff')}
              onSwipeSuccess={() => {
                if (order?.is_secure) {
                  changeOrder('completed', true);
                } else {
                  changeOrder('completed', false);
                }
              }}
              height={Math.max(hp(5), 55)}
              width={wp(77)}
              thumbSize={Math.max(wp(5), 45)}
              railBackgroundColor={colors.white}
              thumbBackgroundColor={colors.black}
              titleColor={colors.black}
            />
          )}
          <TouchableOpacity
            onPress={() => changeOrder('cancel', false)}
            style={[styles.buttonPick, styles.cancelButton]}>
            <CancelIcon width={wp(7)} height={wp(7)}></CancelIcon>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default memo(AcceptedOrderModal);

const styles = StyleSheet.create({
  container: {
    width: wp(100),
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(5),
    borderTopRightRadius: wp(5),
    paddingBottom: Platform.OS === 'ios' ? hp(6) : hp(1),
    position: 'absolute',
  },
  lessContainer: {
    width: wp(91),
    height: hp(4.5),
    borderRadius: wp(2.5),
    backgroundColor: colors.neutral100,
    marginHorizontal: wp(4.5),
    marginBottom: hp(1.5),
    marginTop: hp(1),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(3),
  },
  rowTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textLess: {
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.black,
    fontSize: wp(4.5),
  },
  textTime: {
    color: colors.neutral400,
    marginLeft: wp(1),
  },
  imageContainer: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(50),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blue2,
    marginRight: wp(2),
  },
  rowStreet: {
    flexDirection: 'row',
    marginLeft: wp(4),
    alignItems: 'center',
    marginTop: hp(2),
  },
  addressContainer: {
    marginBottom: hp(0),
  },
  rowTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: wp(8.7),
    justifyContent: 'space-between',
  },
  rowText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(5),
  },
  buttonCall: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(20),
    backgroundColor: colors.neutral300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  buttonCall1: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(20),
    backgroundColor: colors.neutral300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textReciever: {
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.black,
    marginLeft: wp(2),
    width: wp(72.5),
    fontSize: wp(4.3),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: wp(2),
    marginBottom: hp(1.5),
  },
  line: {
    width: wp(91),
    height: wp(0.3),
    backgroundColor: colors.neutral100,
    marginHorizontal: wp(4.5),
    marginBottom: hp(1.5),
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: wp(4),
    marginTop: hp(1.5),
    height: hp(3.5),
    marginBottom: hp(1),
  },
  textTag: {
    color: colors.neutral700,
    fontSize: wp(3.5),
  },
  tagBox: {
    height: hp(3.5),
    backgroundColor: colors.neutral100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(2),
    paddingHorizontal: wp(2),
    marginRight: wp(2),
  },
  buttonContainer: {
    borderRadius: wp(3),
    height: hp(5.8),
    paddingHorizontal: wp(1),
    width: wp(77),
    borderWidth: wp(0.5),
  },
  moreText: {
    color: '#000000ff',
    fontWeight: 'bold',
    fontSize: wp(4.5),
    marginVertical: hp(0.5),
    marginBottom: hp(1.5),
  },
  rowButton: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(0),
  },
  cancelButton: {
    width: Math.max(hp(5), 55),
    height: Math.max(hp(5), 55),
    marginLeft: wp(1),
    backgroundColor: 'transparent',
    borderRadius: wp(3),
    borderColor: colors.error900,
    borderWidth: wp(0.5),
    marginRight: wp(1.5),
  },
  modal: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: hp(0),
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(10),
    backgroundColor: colors.neutral100,
  },
  text: {
    color: colors.neutral900,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(5.5),
    width: wp(46),
    marginRight: wp(2),
  },
  textInfo: {
    fontSize: wp(4.5),
    color: colors.neutral800,
    textAlign: 'left',
    marginLeft: wp(1.3),
    fontFamily: 'arial',
    lineHeight: hp(3),
  },
  textInfo1: {
    fontSize: wp(4.2),
    color: colors.neutral500,
    textAlign: 'left',
    lineHeight: hp(3),
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
