import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from "@react-navigation/native";

import colors from '../../config/colors';
import { RefreshIcon,Menu ,LocationPin1} from '../../../assets/svg';

const CustomHeader = ({onRefreshPress}) => {
   const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <TouchableOpacity 
                activeOpacity={0.6}
                onPress={() => navigation.openDrawer()}
                style={styles.button}>
                   <Menu width={wp(5.5)} height={wp(5.5)}/>
                </TouchableOpacity>
            </View>
            <View style={styles.left}>
                 <TouchableOpacity
                                 activeOpacity={0.6}
                 onPress={onRefreshPress}
                 style={styles.button}>
                  <LocationPin1 width={wp(5.5)} height={wp(5.5)} />
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
        top: hp(3.5),
        zIndex:9999
    },
    left: {
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: wp(35),
    },
    button: {
       width: wp(10.5),
        height:wp(10.5),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: wp(2),
        backgroundColor: colors.white,
        borderColor:colors.neutral200,
        borderWidth:wp(0.4)
    },
});