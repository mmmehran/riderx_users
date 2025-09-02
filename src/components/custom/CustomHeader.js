import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from "@react-navigation/native";

import colors from '../../config/colors';
import { RefreshIcon,Menu } from '../../../assets/svg';

const CustomHeader = ({onRefreshPress}) => {
   const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <TouchableOpacity 
                onPress={() => navigation.openDrawer()}
                style={styles.button}>
                   <Menu width={wp(6)} height={wp(6)} fill={colors.primary} />
                </TouchableOpacity>
            </View>
            <View style={styles.left}>
                 <TouchableOpacity
                 onPress={onRefreshPress}
                 style={styles.button}>
                  <RefreshIcon width={wp(6)} height={wp(6)} fill={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default CustomHeader

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: hp(6),
        marginVertical:hp(1),
        position: 'absolute',
        top: hp(6),
        zIndex:9999
    },
    left: {
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: wp(32),
    },
    button: {
       width: wp(12),
        height:wp(12),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: wp(20),
        backgroundColor: colors.white,
    },
});