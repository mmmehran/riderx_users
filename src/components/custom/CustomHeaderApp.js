import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from "@react-navigation/native";

import colors from '../../config/colors';
import {  ArrowLeft1 } from '../../../assets/svg';
import CustomText from '../common/CustomText';

const CustomHeaderApp = ({title,backPress}) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                 <TouchableOpacity
                         activeOpacity={0.6}
                         onPress={backPress ? backPress :  () => navigation.goBack()}
                         style={styles.button}>
                         <ArrowLeft1 width={wp(3.5)} height={wp(3.5)}></ArrowLeft1>
                       </TouchableOpacity>
            </View>
            <View style={styles.center}>
                <CustomText style={styles.text}>{title}</CustomText>
            </View>
        </View>
    )
}

export default CustomHeaderApp

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: hp(1)
    },
    left: {
        marginLeft: wp(4.5),
        justifyContent: 'center',
    },
    center: {
        justifyContent: 'center',
        alignItems: "flex-start",
        marginLeft:wp(3)
    },
    button: {
       width: wp(8.5),
    height: wp(8.5),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(2),
    backgroundColor: colors.white,
    borderColor: colors.neutral200,
    borderWidth: wp(0.4),
    },
    text:{
        fontSize: wp(6),
        color: colors.neutral800,
    fontFamily: 'YaldeviJaffna-Bold',
        textAlign: 'left',
    }
});