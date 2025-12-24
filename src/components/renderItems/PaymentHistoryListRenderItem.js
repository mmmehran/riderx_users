import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';

import CustomText from '../common/CustomText';
import colors from '../../config/colors';
import {  CashOutIcon,DepositIcon } from '../../../assets/svg/index';
import {convertDate} from '../../utils/helpers'

const PaymentHistoryListRenderItem = ({ item }) => {
  const {t} = useTranslation();

    return (
        <View style={styles.container}>
        {item?.type === "deposit" ? <DepositIcon width={wp(5.6)} height={wp(5.6)} /> : <CashOutIcon width={wp(5)} height={wp(5)} />}
        <View>
                        <CustomText style={styles.title}>€{item?.amount}</CustomText>
            <CustomText style={[styles.typeText]}>
                 {item?.type
                        ? item?.type.charAt(0).toUpperCase() +
                          item?.type.slice(1)
                        : ''}
            </CustomText>
        </View>
        <View style={styles.priceContainer}>
                        <CustomText style={styles.timeText}> {convertDate(item?.timestamp)}</CustomText>
        </View>
        </View>
    )
}

export default memo(PaymentHistoryListRenderItem);

const styles = StyleSheet.create({
    container: {
        backgroundColor: "transparent",
        marginTop:hp(1),
        marginHorizontal:wp(5),
        width: wp(90),
        flexDirection: 'row',
        alignItems:"center",
        paddingHorizontal:wp(0),
        paddingVertical:hp(1),
        borderBottomColor:colors.neutral100,
        borderBottomWidth:wp(0.3)
    },
    title:{
        fontSize: wp(4.5),
        color: colors.contentSecondary,
    fontFamily: 'arial',
        marginLeft:wp(2.5)
    },
    timeText:{
        fontSize: wp(3.5),
        color: colors.neutral400,
    },
    typeText:{
        fontSize: wp(3.5),
        color: colors.neutral500,
        marginLeft:wp(2.5),
        marginTop:hp(0.3)
    },
    priceContainer:{
        alignItems:"flex-end",
        flex:1,
        marginRight:wp(2),
    }
 
 
   



});