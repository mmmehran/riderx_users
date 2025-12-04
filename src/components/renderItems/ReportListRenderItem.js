import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import CustomText from '../common/CustomText';
import colors from '../../config/colors';
import { AddressCircle, UserIcon } from '../../../assets/svg/index';
import {isoTo12Hour,formatDdMon, capitalizeFirstLetter} from '../../utils/helpers'
import {useTranslation} from 'react-i18next';

const ReportListRenderItem = ({ item }) => {

    let num = parseFloat(item?.mileage);       
    let formatted = Number(num.toFixed(1))
  const {t} = useTranslation();

    const STATUS_OPTIONS = [
    {label: t('all'), value: null},
    {label: t('accept'), value: 'accepted'},
    {label: t('pickup'), value: 'pickup'},
    {label: t('shipmentDestroyed'), value: 'shipment_destroyed'},
    {label: t('addressNotFound'), value: 'address_not_found'},
    {label: t('Completed'), value: 'completed'},
    {label: t('Canceled'), value: 'cancel'},
  ];

    const selectedStatusLabel = (() => {
    const s = STATUS_OPTIONS.find(s => s.value === item?.status);
    return s?.label || t('type');
  })();

    return (
        <>
        <View style={styles.container}>
            <View style={styles.rowTop}>
               <View style={styles.timeContainer}>
                                        <CustomText style={styles.time}>{formatDdMon(item?.timestamp)}</CustomText>
                    <CustomText style={styles.time}>{isoTo12Hour(item?.timestamp)}</CustomText>
                </View>
                <View style={styles.statusContainer}>
                    <View style={[styles.circle,{backgroundColor:colors.success900}]}>
                    </View>
                    <CustomText numberOfLines={1} style={styles.textStatus}>{selectedStatusLabel}</CustomText>
             </View>
            </View>
           <View style={styles.row}>
            <View style={styles.icon}>
                <View style={styles.userIcon}>
                                        <CustomText style={[styles.title,{color:"#122368"}]}>{capitalizeFirstLetter(item?.sender?.first_name).charAt(0) + "" + capitalizeFirstLetter(item?.sender?.last_name).charAt(0)}</CustomText>

                </View>
            </View>
                <View style={styles.titleContainer}>
                    <CustomText numberOfLines={1} style={styles.title}>{capitalizeFirstLetter(item?.sender?.first_name) + " " + capitalizeFirstLetter(item?.sender?.last_name)}</CustomText>
                    <View style={styles.kmContainer}>
                        <View style={styles.circle}></View>
                    <CustomText numberOfLines={1} style={styles.dec}> {item?.delivery_package?.title} - {formatted} Km</CustomText>
                    </View>
                </View>
           
           </View>
           <View style={styles.addressContainer}>
        <AddressCircle width={wp(6)} height={hp(10)} />
        <View style={styles.iconLineContainer}>
            <CustomText style={styles.textStart}>{t("start")}</CustomText>
            <CustomText numberOfLines={1} style={styles.address}>{item?.sender_address_json?.full_address}</CustomText>
            <View style={styles.line}></View>
            <CustomText style={styles.textStart}>{t("dropOff")}</CustomText>
            <CustomText numberOfLines={1} style={[styles.address]}>{item?.receiver_address_json?.full_address}</CustomText>
        </View>
        
           </View>
             <View style={styles.priceRow}>
                    <CustomText numberOfLines={1} style={styles.title}>€{item?.rider_fee}</CustomText>
                    <CustomText numberOfLines={1} style={[styles.title,{marginLeft:wp(2), fontSize:wp(3.6),color:colors.gray300}]}>  + €{(item?.rider_fee * 0.2).toFixed(2)}  {t("vat")}</CustomText>
                    </View>
        </View>
        </>
    )
}

export default memo(ReportListRenderItem);

const styles = StyleSheet.create({
    container: {
        marginTop:hp(2),
        marginHorizontal:wp(5),
        borderColor:colors.neutral100,
        borderWidth:wp(0.3),
        padding:wp(5),
        borderRadius:wp(2),
        paddingBottom:hp(1)
    },
    priceRow:{
        flexDirection:"row",
        alignItems:"center",
        marginTop:hp(1.5)

    },
    kmContainer:{
        flexDirection:"row",
        justifyContent:"center",
        alignItems:"center",
        height:hp(2.6),
        borderColor:colors.neutral200,
        borderWidth:wp(0.3),
        borderRadius:wp(2),
        marginTop:hp(0.5),
        paddingHorizontal:wp(2)
    },
    iconLineContainer:{
        marginLeft:wp(1)
    },
    userIcon:{
        width:wp(12.5),
        height:wp(12.5),
        borderRadius:wp(20),
        justifyContent:"center",
        alignItems:"center",
        backgroundColor:colors.blue2
    },
    statusContainer:{
        height:hp(3),
        backgroundColor:colors.success50,
        justifyContent:"center",
        alignItems:"center" ,
        paddingHorizontal:wp(2),
        borderRadius:wp(2),
        flexDirection:"row"
    },
    circle:{
        width:wp(2),
        height:wp(2),
        borderRadius:wp(20),
        backgroundColor:colors.neonTeal300,
        marginRight:wp(1),
    },
    textStart:{
        color:colors.neutral600,
        fontSize:wp(3.2)
    },
    rowTop:{
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center"
    },
    address:{
        color: colors.neutral800,
        fontSize: wp(3.8),
    fontFamily: 'YaldeviJaffna-Bold',
        width: wp(80),
    },
    icon:{
        marginTop:hp(0.5)
    },
    addressContainer:{
        marginTop:hp(1.5),
        flexDirection: 'row',
        alignItems: 'center',
    },
    row:{
        flexDirection: 'row',
        marginTop:hp(1)
    },
    titleContainer:{
        marginLeft:wp(3.5),
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
    dec:{
        color: colors.neutral800,
        fontWeight:"bold",
        fontFamily: 'arial',
        fontSize:wp(3.2)
    },
    timeContainer:{
        flexDirection:"row"
    },
    time: {
        color: colors.neutral900,
            fontFamily: 'arial',
            fontWeight:"bold"
    },
    line:{
        width: wp(73),
        height:wp(0.3),
        backgroundColor :colors.neutral100,
        marginVertical:hp(1)
    }
 
   



});