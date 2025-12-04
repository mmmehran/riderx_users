import React, {memo, useEffect, useState, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';
import axios from 'axios';
import SwipeButton from '../components/common/SwipeButton';

import colors from '../config/colors';
import CustomText from '../components/common/CustomText';
import {AddressLine, BlueCircle} from '../../assets/svg/index';
import {normalizeLabel} from '../utils/helpers';

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kZzVoNnU2MGlhcDJpcGVuNGV1amYxdyJ9.YMqlR9OovVOp-pm9yGK7eA';

const AcceptOrderModal = ({
  onAccept,
  order,
  pickUpTime,
  userCoord, // <-- [lng, lat] from parent (Mapbox camera / user location)
}) => {
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
  }, [userCoord, pickupCoord, dropCoord]);

  useEffect(() => {
    userToPickupMins && pickUpTime(userToPickupMins);
  }, [userToPickupMins]);

  const handleAccept = () => {
    onAccept?.();
  };

  const fmtLeg = (mins, km) => {
    if (mins == null || km == null) return '-';
    return `${mins} ${t('mins')} - ${km} ${t('km')}`;
  };

  return (
    <View style={[styles.modal]}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <AddressLine width={wp(6)} height={hp(7.6)}></AddressLine>
          <View style={{marginTop: hp(1.5)}}>
            <View style={styles.row}>
              <CustomText style={styles.textAddress} numberOfLines={1}>
                {pickupLabel}
              </CustomText>
              <View style={styles.durationContainer}>
                <BlueCircle></BlueCircle>
                <CustomText style={styles.textTime}>
                  {fmtLeg(userToPickupMins, userToPickupKm)}
                </CustomText>
              </View>
            </View>
            <View style={styles.row}>
              <CustomText style={styles.textAddress} numberOfLines={1}>
                {dropLabel}
              </CustomText>
              <View style={styles.durationContainer}>
                <BlueCircle></BlueCircle>
                <CustomText style={styles.textTime}>
                  {fmtLeg(pickupToDropMins, pickupToDropKm)}
                </CustomText>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.line} />
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
        <View style={styles.buttonWrapper}>
          <View style={{width: wp(21), alignItems: 'center',    marginRight:wp(1.5)}}>
            <CustomText style={styles.textPrice} numberOfLines={1}>
              €{order?.rider_fee}
            </CustomText>
            <CustomText style={styles.textPrice1}>{t('price')}</CustomText>
          </View>

          <SwipeButton
            title={t('Accept')}
            onSwipeSuccess={handleAccept}
            height={Math.max(hp(5), 55)}
            width={wp(73.5)}
            thumbSize={Math.max(wp(5), 45)}
            railBackgroundColor={colors.black}
            thumbBackgroundColor={colors.neonYellow}
            titleColor="#fff"
          />
        </View>
      </View>
    </View>
  );
};

export default memo(AcceptOrderModal);

const styles = StyleSheet.create({
  container: {
    width: wp(100),
    height: hp(26),
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(5),
    borderTopRightRadius: wp(5),
    paddingBottom: hp(1),
  },
  swipeCapture: {
    flex: 1,
    justifyContent: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: wp(4),
    marginTop: hp(1),
    height: hp(4),
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
    height: Math.max(hp(7), 60),
    marginTop: hp(1),
    paddingHorizontal: wp(1),
    width: wp(73.5),
  },
  row: {
    flexDirection: 'row',
    marginLeft: wp(2),
    marginBottom: hp(1.5),
  },
  textAddress: {
    fontFamily: 'arial',
    color: colors.black,
    width: wp(50),
    marginTop: hp(0.54),
  },
  textTime: {
    fontFamily: 'arial',
    color: colors.black,
    fontSize: wp(3.5),
    marginLeft: wp(0.1),
    marginRight:wp(1)
  },
  durationContainer: {
    width: wp(34),
    height: hp(3.2),
    borderWidth: wp(0.3),
    borderColor: colors.neutral200,
    borderRadius: wp(2),
    marginLeft: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal:wp(2),
    overflow:"hidden"
  },
  circle: {
    width: wp(2),
    height: wp(2),
    backgroundColor: colors.black,
    borderRadius: wp(50),
    marginTop: hp(1),
  },
  modal: {
    bottom: hp(6),
    position: 'absolute',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  buttonWrapper: {
    marginLeft: wp(2),
    marginTop: hp(0.6),
    flexDirection: 'row',
    alignItems: 'center',
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
  textPrice: {
    fontSize: wp(7),
    color: colors.black,
    fontFamily: 'arial',
    marginLeft: wp(1),
    lineHeight: hp(3.5),
    width: wp(23),
    textAlign: 'center',
  },
  textPrice1: {
    fontSize: wp(4),
    color: colors.neutral500,
    fontFamily: 'arial',
    marginLeft: wp(2),
  },
  line: {
    width: wp(91),
    height: wp(0.3),
    backgroundColor: colors.neutral100,
    marginHorizontal: wp(4.5),
  },
});
