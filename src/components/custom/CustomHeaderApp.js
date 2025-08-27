import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from "@react-navigation/native";

import colors from '../../config/colors';
import {  ArrowLeft } from '../../../assets/svg';
import CustomText from '../common/CustomText';

const CustomHeaderApp = ({title}) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.button}>
                    <ArrowLeft width={wp(5)} height={wp(5)}></ArrowLeft>
                </TouchableOpacity>
            </View>
            <View style={styles.center}>
                <CustomText style={styles.text}>{title}</CustomText>
            </View>
            <View style={[styles.left, { alignItems: "flex-end" }]}>
               
            </View>
        </View>
    )
}

export default CustomHeaderApp

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: hp(6),
        marginVertical: hp(1)
    },
    left: {
        flex: 1,
        marginHorizontal: wp(6),
        justifyContent: 'center',
    },
    center: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        width: wp(9),
        height: wp(9),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: wp(50),
        backgroundColor: "rgba(136, 136, 136, 0.1)",
    },
    text:{
        fontSize: wp(6),
        color: colors.black,
        fontWeight: '900',
        textAlign: 'center',
    }
});