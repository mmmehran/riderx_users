import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from "@react-navigation/native";

import colors from '../../config/colors';
import { ArrowLeft1, Message1 } from '../../../assets/svg';
import CustomText from '../common/CustomText';

const CustomHeaderChat = ({ title, backPress, name, image, status }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={backPress ? backPress : () => navigation.goBack()}
                    style={styles.button}>
                    <ArrowLeft1 width={wp(3.5)} height={wp(3.5)}></ArrowLeft1>
                </TouchableOpacity>
            </View>
            <View style={styles.center}>
                <View style={styles.row}>
                    {image ? (
                        <Image
                            style={styles.image}
                            source={{ uri: image }} />
                    ) : (
                        <View style={[styles.image, { backgroundColor: colors.neutral100, borderRadius: wp(5), justifyContent: 'center', alignItems: 'center' }]}>
                            <CustomText style={{ fontSize: wp(4) }}>{name?.charAt(0)}</CustomText>
                        </View>
                    )}
                    <View style={{ marginLeft: wp(2) }}>
                        <CustomText style={styles.textName}>{name || 'Chat'}</CustomText>
                        {/* <View style={styles.row}>
                            <View style={[styles.dot, { backgroundColor: status === 'Online' ? colors.neonTeal300 : colors.neutral400 }]}></View>
                            <CustomText style={styles.textStatus}>{status || 'Offline'}</CustomText>
                        </View> */}
                    </View>
                </View>
            </View>
            <View style={[styles.left, { marginRight: wp(4.5), marginLeft: 0, alignItems: "flex-end" }]}>
                <TouchableOpacity
                    activeOpacity={0.6}
                    //  onPress={backPress ? backPress : () => navigation.goBack()}
                    style={styles.button}>
                    <Message1 width={wp(4)} height={wp(4)}></Message1>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default CustomHeaderChat

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: hp(1)
    },
    left: {
        marginLeft: wp(4.5),
        justifyContent: 'center',
        flex: 1,
    },
    textStatus: {
        fontSize: wp(3.3),
        color: colors.neutral400,
        textAlign: 'left',
    },
    textName: {
        fontSize: wp(4),
        color: colors.neutral900,
        textAlign: 'left',
    },
    center: {
        justifyContent: 'center',
        alignItems: "flex-start",
        flex: 10,
        marginLeft: wp(4)
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
    text: {
        fontSize: wp(6),
        color: colors.neutral800,
        fontFamily: 'YaldeviJaffna-Bold',
        textAlign: 'left',
    },
    image: {
        width: wp(9),
        height: wp(9),
        borderRadius: wp(20),
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: wp(1.8),
        height: wp(1.8),
        borderRadius: wp(5),
        backgroundColor: colors.neonTeal300,
        marginRight: wp(1.5),
    }
});