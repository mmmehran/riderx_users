import React, { memo, useState, useEffect } from 'react';
import axios from 'axios';
import { View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import CustomText from '../common/CustomText';
import colors from '../../config/colors';
import { isoTo12Hour, formatDdMon, capitalizeFirstLetter } from '../../utils/helpers'
import { useTranslation } from 'react-i18next';
import SwipeButton from '../common/SwipeButton';

const MAPBOX_TOKEN =
    'pk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kZzVoNnU2MGlhcDJpcGVuNGV1amYxdyJ9.YMqlR9OovVOp-pm9yGK7eA';

const ReportListRenderItem = ({ item, multi = false, multiOrder, handleAccept, show = false }) => {

    // START: Route calculation state
    const [distanceKm, setDistanceKm] = useState(null);
    const [durationMins, setDurationMins] = useState(null);

    const buildDirectionsUrl = (a, b) =>
        `https://api.mapbox.com/directions/v5/mapbox/driving/${a[0]},${a[1]};${b[0]},${b[1]}?geometries=geojson&overview=false&access_token=${MAPBOX_TOKEN}`;

    const fetchLegMetrics = async (a, b) => {
        try {
            const res = await axios.get(buildDirectionsUrl(a, b));
            const r = res?.data?.routes?.[0];
            if (!r) return { km: null, mins: null };
            const km = (r.distance ?? 0) / 1000; // meters -> km
            const mins = Math.max(1, Math.round((r.duration ?? 0) / 60)); // seconds -> mins
            return { km, mins };
        } catch {
            return { km: null, mins: null };
        }
    };

    useEffect(() => {
        if (!multi) return;
        const getMetrics = async () => {
            const sLat = Number(item?.sender_latitude);
            const sLon = Number(item?.sender_longitude);
            const rLat = Number(item?.receiver_latitude);
            const rLon = Number(item?.receiver_longitude);

            if (Number.isFinite(sLat) && Number.isFinite(sLon) && Number.isFinite(rLat) && Number.isFinite(rLon)) {
                const { km, mins } = await fetchLegMetrics([sLon, sLat], [rLon, rLat]);
                setDistanceKm(km != null ? Number(km.toFixed(1)) : null);
                setDurationMins(mins);
            }
        };
        getMetrics();
    }, [item, multi]);
    // END: Route calculation logic

    let num = parseFloat(item?.mileage);
    let formatted = Number(num.toFixed(1))
    const { t } = useTranslation();

    const fmtLeg = (mins, km) => {
        if (mins == null || km == null) return '-';
        return `${mins} ${t('mins')} - ${km} ${t('km')}`;
    };


    return (
        <>
            <View style={styles.container}>
                <View style={styles.rowTop}>
                    <View style={styles.timeContainer}>
                        <CustomText style={styles.time}>{formatDdMon(item?.timestamp)}</CustomText>
                        <CustomText style={styles.time}>{isoTo12Hour(item?.timestamp)}</CustomText>
                    </View>
                </View>
                {!show && <View style={styles.row}>
                    <View style={styles.icon}>
                        <View style={styles.userIcon}>
                            <CustomText style={[styles.title, { color: "#122368" }]}>{capitalizeFirstLetter(item?.sender?.first_name).charAt(0) + "" + capitalizeFirstLetter(item?.sender?.last_name).charAt(0)}</CustomText>
                        </View>
                    </View>
                    <View style={styles.titleContainer}>
                        <CustomText numberOfLines={1} style={styles.title}>{capitalizeFirstLetter(item?.sender?.first_name) + " " + capitalizeFirstLetter(item?.sender?.last_name)}</CustomText>
                        <View style={styles.kmContainer}>
                            <View style={styles.circle}></View>
                            <CustomText numberOfLines={1} style={styles.dec}>{!multi ? `${item?.delivery_package?.title} - ${formatted} Km` : fmtLeg(durationMins, distanceKm)}</CustomText>
                        </View>
                    </View>
                </View>}
                <View style={styles.addressContainer}>
                    <View style={styles.iconLineContainer}>
                        <View style={styles.rowContianer}>
                            <View style={{ alignItems: "center" }}>
                                <View style={styles.circleSuc}></View>
                                <View style={styles.lineSuc}></View>
                            </View>
                            <View>
                                <CustomText style={styles.textStart}>{multiOrder[0]?.type === "sender" ? t("pickup") : t("dropOff")}</CustomText>
                                <CustomText numberOfLines={1} style={styles.address}>{multiOrder[0]?.full_address}</CustomText>
                                <View style={styles.line}></View>
                            </View>
                        </View>
                        {multiOrder?.slice(1, multiOrder?.length)?.map((order, index) => {
                            return (
                                <View style={styles.rowContianer}>
                                    <View style={{ alignItems: "center" }}>
                                        <View style={styles.circleSuc1}>
                                            <View style={styles.mainCircle}></View>
                                        </View>
                                        {index !== multiOrder?.length - 2 && <View style={styles.lineSuc}></View>}
                                    </View>
                                    <View>
                                        <CustomText style={styles.textStart}>{order?.type === "sender" ? t("pickup") : t("dropOff")}</CustomText>
                                        <CustomText numberOfLines={1} style={styles.address}>{order?.full_address}</CustomText>
                                        {index !== multiOrder?.length - 2 && <View style={styles.line}></View>
                                        }
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                </View>
                {!show && <View style={styles.priceRow}>
                    <CustomText numberOfLines={1} style={styles.title}>+€{item?.rider_fee}</CustomText>
                    <CustomText numberOfLines={1} style={[styles.title, { marginLeft: wp(2), fontSize: wp(3.6), color: colors.gray300 }]}>  + €{(item?.rider_fee * 0.2).toFixed(2)}  {t("vat")}</CustomText>
                </View>}
                {!show ? <SwipeButton
                    title={t('Accept')}
                    onSwipeSuccess={handleAccept}
                    height={Math.max(hp(5), 55)}
                    width={wp(80)}
                    thumbSize={Math.max(wp(5), 45)}
                    railBackgroundColor={colors.black}
                    thumbBackgroundColor={colors.neonYellow}
                    titleColor="#fff"
                /> : null}
            </View >
        </>
    )
}

export default memo(ReportListRenderItem);

const styles = StyleSheet.create({
    container: {
        marginTop: hp(2),
        marginHorizontal: wp(5),
        borderColor: colors.neutral100,
        borderWidth: wp(0.3),
        padding: wp(5),
        borderRadius: wp(2),
        paddingBottom: hp(1),
        marginBottom: hp(3)
    },
    lineSuc: {
        width: wp(1),
        height: hp(4),
        backgroundColor: "#00CDB5",
        marginRight: wp(2)
    },
    rowContianer: {
        flexDirection: "row",
    },
    circleSuc: {
        width: wp(5),
        height: wp(5),
        borderRadius: wp(50),
        backgroundColor: colors.white,
        borderColor: "#00CDB5",
        borderWidth: wp(1.5),
        marginRight: wp(2)
    },
    circleSuc1: {
        width: wp(4.5),
        height: wp(4.5),
        borderRadius: wp(50),
        backgroundColor: colors.white,
        borderColor: "#00CDB5",
        borderWidth: wp(0.6),
        marginRight: wp(2),
        marginLeft: wp(0.5),
        justifyContent: "center",
        alignItems: "center"
    },
    mainCircle: {
        width: wp(2.5),
        height: wp(2.5),
        borderRadius: wp(50),
        backgroundColor: "#00CDB5",
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: hp(1.5),
        marginBottom: hp(1.3)

    },
    kmContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: hp(2.6),
        borderColor: colors.neutral200,
        borderWidth: wp(0.3),
        borderRadius: wp(2),
        marginTop: hp(0.5),
        paddingHorizontal: wp(2)
    },
    iconLineContainer: {
        marginLeft: wp(1)
    },
    userIcon: {
        width: wp(12.5),
        height: wp(12.5),
        borderRadius: wp(20),
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.blue2
    },
    statusContainer: {
        height: hp(3),
        backgroundColor: colors.success50,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: wp(2),
        borderRadius: wp(2),
        flexDirection: "row"
    },
    circle: {
        width: wp(2),
        height: wp(2),
        borderRadius: wp(20),
        backgroundColor: colors.neonTeal300,
        marginRight: wp(1),
    },
    textStart: {
        color: colors.neutral600,
        fontSize: wp(3.2)
    },
    rowTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    address: {
        color: colors.neutral800,
        fontSize: wp(3.8),
        fontFamily: 'YaldeviJaffna-Bold',
        width: wp(74),
    },
    icon: {
        marginTop: hp(0.5)
    },
    addressContainer: {
        marginTop: hp(1.5),
        flexDirection: 'row',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        marginTop: hp(1)
    },
    titleContainer: {
        marginLeft: wp(3.5),
    },
    title: {
        fontSize: wp(4.6),
        fontFamily: 'YaldeviJaffna-Bold',
        color: colors.neutral900,
    },
    textStatus: {
        fontSize: wp(3.2),
        fontFamily: 'YaldeviJaffna-Bold',
        color: colors.success900,
    },
    dec: {
        color: colors.neutral800,
        fontWeight: "bold",
        fontFamily: 'arial',
        fontSize: wp(3.2)
    },
    timeContainer: {
        flexDirection: "row"
    },
    time: {
        color: colors.neutral900,
        fontFamily: 'arial',
        fontWeight: "bold"
    },
    line: {
        width: wp(73),
        height: wp(0.3),
        backgroundColor: colors.neutral100,
    }





});