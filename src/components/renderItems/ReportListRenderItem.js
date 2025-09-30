import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import CustomText from '../common/CustomText';
import colors from '../../config/colors';
import { AddressCircle, UserIcon } from '../../../assets/svg/index';
import {isoTo12Hour} from '../../utils/helpers'

const ReportListRenderItem = ({ item }) => {

    let num = parseFloat(item?.mileage);       
    let formatted = Number(num.toFixed(1))

    return (
        <>
        <View style={styles.container}>
           <View style={styles.row}>
            <View style={styles.icon}>
                <UserIcon width={wp(10)} height={wp(10)} />
            </View>
                <View style={styles.titleContainer}>
                    <CustomText numberOfLines={1} style={styles.title}>{item?.rider_fee} €</CustomText>
                    <CustomText numberOfLines={1} style={styles.title}>{item?.status}</CustomText>
                    <CustomText numberOfLines={1} style={styles.dec}>{item?.delivery_package?.title} - {formatted} Km</CustomText>
                </View>
                <View style={styles.timeContainer}>
                    <CustomText style={styles.time}>{isoTo12Hour(item?.timestamp)}</CustomText>
                </View>
           </View>
           <View style={styles.addressContainer}>
        <AddressCircle width={wp(7)} height={wp(11)} />
        <View>
            <CustomText numberOfLines={1} style={styles.address}>{item?.sender_address_json?.full_address}</CustomText>
            <CustomText numberOfLines={1} style={[styles.address,{marginTop:hp(1)}]}>{item?.receiver_address_json?.full_address}</CustomText>
        </View>
           </View>
        </View>
        <View style={styles.line}></View>
        </>
    )
}

export default memo(ReportListRenderItem);

const styles = StyleSheet.create({
    container: {
        flex:1,
       // backgroundColor: colors.gray100,
        marginTop:hp(2),
        marginHorizontal:wp(5)
    },
    address:{
        color: "rgba(70, 67, 67, 0.84)",
        fontSize: wp(3.8),
        fontWeight: '900',
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
        borderBottomColor:"rgba(125, 125, 125, 0.5)",
        borderBottomWidth: wp(0.1),
        paddingBottom:hp(1.5)
    },
    titleContainer:{
        marginLeft:wp(3.5),
        width: wp(55),
    },
    title: {
        fontSize: wp(4.6),
        fontWeight: '900',
        color: colors.black,
    },
    dec:{
        color: colors.gray300,
        fontWeight: '500',
        marginTop:hp(0.2)
    },
    timeContainer:{
        alignItems:"flex-end",
        flex:1,
    },
    time: {
        color: colors.gray200,
         fontWeight: '900',
    },
    line:{
        width: wp(100),
        height:wp(0.3),
        backgroundColor :"rgba(125, 125, 125, 0.5)",
        marginTop:hp(3),
        marginBottom:hp(1)
    }
 
   



});