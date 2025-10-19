import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from "@react-navigation/native";
import {useTranslation} from 'react-i18next';

import colors from '../../config/colors';
import { ChooseService,CarIcon } from '../../../assets/svg';
import CustomText from '../common/CustomText';
import routes from '../../navigation/routes';

const CustomBottomTab = ({style}) => {
   const navigation = useNavigation();
  const {t} = useTranslation();

    return (
        <View style={[styles.container,style]}>
            <View style={styles.left}>
                <TouchableOpacity 
                onPress={() => navigation.navigate(routes.CHOOSESERVICE)}
                style={styles.button}>
                   <ChooseService width={wp(20)} height={wp(20)} fill={colors.primary} />
                </TouchableOpacity>
            </View>
            <View style={styles.center}>
                <CustomText style={styles.text}>{t("findRide")}</CustomText>
            </View>
            <View style={styles.left}>
                 <TouchableOpacity
                    onPress={() => navigation.navigate(routes.CHOOSEVEHICLE)}
                 style={styles.button}>
                  <CarIcon width={wp(8)} height={wp(8)} fill={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default CustomBottomTab

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: hp(9),
        marginVertical:hp(1),
        position: 'absolute',
        bottom: hp(-1),
        zIndex:9999,
        backgroundColor:colors.white,
        overflow:"hidden",
    },
    left: {
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: wp(23),
    },
    button: {
       width: wp(12),
        height:wp(12),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: wp(20),
        backgroundColor: colors.white,
    },
    center:{
        justifyContent:"center",
        alignItems:"center"
    },
    text:{
        fontSize:wp(5.5),
        fontWeight:"bold"
    }
});