import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import colors from '../../config/colors';
import CustomText from './CustomText';
import { EyeOn, EyeOff } from '../../../assets/svg/index';

const CustomInput = ({
    onChangeText,
    placeholder,
    stylesInput,
    openKeyboard,
    inputMainStyle,
    disable,
    icon,
    password = false,
    ...otherprops }) => {
    const [focus, setFocus] = useState(false)
    const inputRef = useRef();
    const [showPassword, setShowPassword] = useState(false)

    return (
        !disable ?
            <View style={[styles.inputContainer, password && styles.disableContainer, stylesInput]}>
                {icon}
                <TextInput
                    ref={inputRef}
                    style={[styles.input,inputMainStyle]}
                    {...otherprops}
                    onChangeText={onChangeText}
                    placeholderTextColor={colors.textLight}
                    placeholder={placeholder}
                    secureTextEntry={password ? !showPassword : false}
                >
                </TextInput>
                {password ?
                    showPassword ?
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <EyeOn />
                        </TouchableOpacity>
                        :
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <EyeOff></EyeOff>
                        </TouchableOpacity>
                    : null
                }

            </View>
            :
            <View style={[styles.inputContainer, stylesInput]}>
                <CustomText style={styles.placeHolderText}>{placeholder}</CustomText>
            </View>


    )
}

export default CustomInput

const styles = StyleSheet.create({
    inputContainer: {
        width: wp(89),
        height: hp(6),
        backgroundColor: colors.white,
        paddingVertical: hp(0),
        marginHorizontal: wp(5.5),
        borderRadius: wp(2.5),
        borderWidth: wp(0.3),
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: wp(6)
    },
    focusStyle: {
        borderColor: colors.primary,
        borderWidth: wp(0.5)
    },
    placeHolderText: {
        color: colors.gray500,
        textAlign: "left",
        fontSize: wp(4.2)
    },
    input: {
        height: hp(6),
        color: colors.lightGray,
        textAlign: "left",
        width: wp(76),
        paddingRight: wp(4),
        paddingLeft: wp(2),
        fontSize: wp(3.5),
        fontFamily: "Poppins-Regular",
        paddingTop: hp(1.5),
    },
    disableContainer: {
        paddingLeft: wp(3),

    }
});