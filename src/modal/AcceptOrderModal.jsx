import React, {memo, useRef, useEffect, useState, useMemo} from 'react';
import {StyleSheet, View, TouchableOpacity, Animated} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';
import axios from 'axios';
import SwipeButton from 'rn-swipe-button';

import CustomModal from '../components/common/CustomModal';
import colors from '../config/colors';
import CustomText from '../components/common/CustomText';
import {Line2, StarIcon} from '../../assets/svg/index';
import {isAndroid15Plus} from '../utils/helpers';
const MAPBOX_TOKEN =
  'pk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kZzVoNnU2MGlhcDJpcGVuNGV1amYxdyJ9.YMqlR9OovVOp-pm9yGK7eA';

/**
 * Pass user's camera/location from parent:
 *   <AcceptOrderModal userCoord={[lng, lat]} ... />
 */
const AcceptOrderModal = ({
  isVisible,
  onClose,
  onAccept,
  order,
  insets,
  pickUpTime,
  userCoord, // <-- [lng, lat] from parent (Mapbox camera / user location)
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  const {t} = useTranslation();

  // mins/km calculated here (no geolocation inside the modal)
  const [userToPickupKm, setUserToPickupKm] = useState(null);
  const [userToPickupMins, setUserToPickupMins] = useState(null);
  const [pickupToDropKm, setPickupToDropKm] = useState(null);
  const [pickupToDropMins, setPickupToDropMins] = useState(null);

  const pickupCoord = useMemo(() => {
    const lat = Number(order?.sender_latitude);
    const lon = Number(order?.sender_longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) ? [lon, lat] : null;
  }, [order]);

  const dropCoord = useMemo(() => {
    const lat = Number(order?.receiver_latitude);
    const lon = Number(order?.receiver_longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) ? [lon, lat] : null;
  }, [order]);

  const pickupLabel = useMemo(
    () => `${order?.sender_address_json?.full_address}` || '-',
    [order],
  );
  const dropLabel = useMemo(
    () => `${order?.receiver_address_json?.full_address}` || '-',
    [order],
  );

  const buildDirectionsUrl = (a, b) =>
    `https://api.mapbox.com/directions/v5/mapbox/driving/${a[0]},${a[1]};${b[0]},${b[1]}?geometries=geojson&overview=false&access_token=${MAPBOX_TOKEN}`;

  const fetchLegMetrics = async (a, b) => {
    try {
      const res = await axios.get(buildDirectionsUrl(a, b));
      const r = res?.data?.routes?.[0];
      if (!r) return {km: null, mins: null};
      const km = (r.distance ?? 0) / 1000; // meters -> km
      const mins = Math.max(1, Math.round((r.duration ?? 0) / 60)); // seconds -> mins
      return {km, mins};
    } catch {
      return {km: null, mins: null};
    }
  };

  // Compute both legs whenever modal opens or inputs change
  useEffect(() => {
    let cancelled = false;

    const compute = async () => {
      setUserToPickupKm(null);
      setUserToPickupMins(null);
      setPickupToDropKm(null);
      setPickupToDropMins(null);

      if (!isVisible) return;
      if (!userCoord || !pickupCoord || !dropCoord) return;

      const [leg1, leg2] = await Promise.all([
        fetchLegMetrics(userCoord, pickupCoord), // user -> pickup
        fetchLegMetrics(pickupCoord, dropCoord), // pickup -> drop
      ]);
      if (cancelled) return;
      const roundInt = v => (v == null ? null : Math.round(v));
      setUserToPickupKm(roundInt(leg1.km));
      setUserToPickupMins(leg1.mins);
      setPickupToDropKm(roundInt(leg2.km));
      setPickupToDropMins(leg2.mins);
    };
    compute();
    return () => {
      cancelled = true;
    };
  }, [isVisible, userCoord, pickupCoord, dropCoord]);

  useEffect(() => {
    userToPickupMins && pickUpTime(userToPickupMins);
  }, [userToPickupMins]);

  // Accept/Auto-close animation
  useEffect(() => {
    if (isVisible) {
      progressAnim.setValue(0);
      animationRef.current = Animated.timing(progressAnim, {
        toValue: 1,
        duration: 15000, // 15 seconds
        useNativeDriver: false,
      });
      animationRef.current.start(() => onClose?.());
    } else {
      progressAnim.setValue(0);
    }
    return () => {
      animationRef.current?.stop();
    };
  }, [isVisible]);

  const handleAccept = () => {
    onAccept?.();
  };

  const fmtLeg = (mins, km) => {
    if (mins == null || km == null) return '-';
    return `${mins} ${t('mins') || 'mins'} (${km} ${t('km') || 'km'}) ${
      t('away') || 'away'
    }`;
  };

  return (
    <CustomModal
      style={[
        styles.modal,
        isAndroid15Plus && {
          bottom: hp(insets.bottom * 0.15),
        },
      ]}
      isVisible={isVisible}
      backdropOpacity={0}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.deliveryContainer}>
            <CustomText style={styles.textDelivery}>{t('delivery')}</CustomText>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeContainer}>
            <CustomText style={[styles.textDelivery, {fontSize: wp(5)}]}>
              x
            </CustomText>
          </TouchableOpacity>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <CustomText style={styles.textPrice}>€{order?.rider_fee}</CustomText>
          <CustomText
            numberOfLines={1}
            style={[
              styles.title,
              {
                marginLeft: wp(2),
                fontSize: wp(5),
                color: colors.gray300,
                marginTop: hp(1.5),
              },
            ]}>
            {' '}
            + €{(order?.rider_fee * 0.2).toFixed(2)} {t('vat')}
          </CustomText>
        </View>

        <View style={styles.starContainer}>
          <StarIcon />
          <CustomText style={styles.textStar}>{order?.id}</CustomText>
        </View>

        <View style={styles.line} />

        <View style={styles.addressContainer}>
          <View style={styles.circle}>
            <Line2 />
          </View>
          <View>
            {/* User -> Pickup */}
            <CustomText style={styles.textTop}>
              {fmtLeg(userToPickupMins, userToPickupKm)}
            </CustomText>
            <CustomText
              numberOfLines={3}
              style={[
                styles.textTop,
                {
                  color: 'rgba(70, 67, 67, 0.84)',
                  marginTop: hp(0.3),
                  width: wp(60),
                },
              ]}>
              {pickupLabel}
            </CustomText>

            {/* Pickup -> Drop */}
            <CustomText style={[styles.textTop, {marginTop: hp(4)}]}>
              {fmtLeg(pickupToDropMins, pickupToDropKm)}
            </CustomText>
            <CustomText
              numberOfLines={3}
              style={[
                styles.textTop,
                {
                  color: 'rgba(70, 67, 67, 0.84)',
                  marginTop: hp(0.3),
                  width: wp(60),
                },
              ]}>
              {dropLabel}
            </CustomText>
          </View>
        </View>
        <View style={styles.buttonWrapper}>
          <SwipeButton
            title={t('SlidetoAccept')}
            titleColor="#fff"
            height={hp(5.5)}
            titleFontSize={wp(4)}
            onSwipeSuccess={handleAccept}
            width={wp(75)}
            railBackgroundColor="#303030ff"
            railBorderColor="#303030ff"
            railFillBackgroundColor="#ffe71046"
            railFillBorderColor="#303030ff"
            thumbIconBackgroundColor="#FFE710"
            thumbIconBorderColor="#303030ff"
          />
        </View>
      </View>
    </CustomModal>
  );
};

export default memo(AcceptOrderModal);

const styles = StyleSheet.create({
  container: {
    width: wp(84),
    height: hp(54),
    backgroundColor: colors.white,
    borderRadius: wp(3),
    borderWidth: wp(1),
    borderColor: '#FFE710',
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
    height: hp(22),
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
    backgroundColor: '#FFE710',
    justifyContent: 'center',
    borderRadius: wp(1),
    marginLeft: wp(3),
    paddingLeft: wp(2),
  },
  buttonWrapper: {
    marginHorizontal: wp(2),
    marginTop: hp(2),
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
