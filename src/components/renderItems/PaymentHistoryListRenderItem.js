import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';

import CustomText from '../common/CustomText';
import colors from '../../config/colors';
import {  Calendar } from '../../../assets/svg/index';
import {convertDate} from '../../utils/helpers'

const PaymentHistoryListRenderItem = ({ item }) => {
  const {t} = useTranslation();

    return (
        <View style={styles.container}>
        <Calendar width={wp(9)} height={wp(9)} />
        <View>
            <CustomText style={[[styles.title,{marginTop:hp(0.5)}]]}>{item?.type} | {item?.status}</CustomText>
            <CustomText style={[styles.title,{fontSize:wp(3.5)}]}>{t("initiated")} {convertDate(item?.timestamp)}</CustomText>
        </View>
        <View style={styles.priceContainer}>
            <CustomText style={[styles.title,{fontSize:wp(5)}]}>{item?.amount} €</CustomText>
        </View>
        </View>
    )
}

export default memo(PaymentHistoryListRenderItem);

const styles = StyleSheet.create({
    container: {
        backgroundColor: "rgba(217, 217, 217, 0.37)",
        marginTop:hp(1),
        marginHorizontal:wp(5),
        width: wp(90),
        flexDirection: 'row',
        alignItems:"center",
        paddingHorizontal:wp(3),
        paddingVertical:hp(1)
    },
    title:{
        fontSize: wp(4.5),
        fontWeight: 'bold',
        color: colors.gray200,
        marginBottom: hp(0.5),
        marginLeft: wp(2),
    },
    priceContainer:{
        alignItems:"flex-end",
        flex:1,
        marginRight:wp(2),
    }
 
 
   



});