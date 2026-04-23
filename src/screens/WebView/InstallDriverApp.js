import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Keyboard,
    TouchableOpacity,
    Modal,
    Platform,
    Text,
    Linking,
} from 'react-native';
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import * as Yup from 'yup';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { IOS_CLIENT_ID, WEB_CLIENT_ID } from "@env";

import CustomScreen from '../../components/common/CustomScreen';
import { Form, Input, Button } from '../../components/form/index';
import { postData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import { showToast, showError } from '../../utils/helpers';
import {
    Logo,
    Google,
    Apple,
    PersonIcon,
    KeyboardIcon,
} from '../../../assets/svg/index';
import { login } from '../../redux/reducers/authenticationReducer';
import { setConfigTest, setConfig } from '../../services/defaultAxios';
import CustomText from '../../components/common/CustomText';
import colors from '../../config/colors';
import i18n, { applyLanguage } from '../../utils/i18n';
import routes from '../../navigation/routes';
import { version } from '../../../package.json';
import CustomButton from '../../components/common/CustomButton';

const LANGS = [
    { code: 'en', label: 'English', rtl: false },
    { code: 'de', label: 'Deutsch', rtl: false },
    { code: 'tr', label: 'Türkçe', rtl: false },
    { code: 'fa', label: 'فارسی', rtl: true },
    { code: 'ar', label: 'العربية', rtl: true },
];

const REMEMBER_KEY = 'remember_credentials_v1';

const InstallDriverApp = props => {
    const formikRef = useRef(null);
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const [langModal, setLangModal] = useState(false);

    const openLangModal = () => setLangModal(true);
    const handleLanguageSelect = async (code, rtl) => {
        setLangModal(false);
        await applyLanguage(code);
    };
    const currentLabel =
        (LANGS.find(l => l.code === i18n.language) || {})?.label || 'English';

    return (
        <CustomScreen>
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}>
                <CustomText style={styles.title}>
                    Please Install Driver App
                </CustomText>
                <View style={styles.formContainer}>
                    <View
                        style={[
                            styles.line,
                            { marginTop: hp(3), marginBottom: hp(3), width: wp(92), marginHorizontal: wp(4) },
                        ]}></View>

                    <CustomText style={[styles.textSignu, { fontSize: wp(4) }]}>
                        You can't use this app with a driver account.
                    </CustomText>
                    <CustomText style={[styles.textSignu, { fontSize: wp(4) }]}>
                        Please install driver app
                    </CustomText>

                    <CustomButton style={styles.rowContainer} onPress={() => {
                        const driverAppiOSUrl = "https://apps.apple.com/at/app/riderx-drivers/id6759214674"
                        const driverAppAndroidUrl = "https://play.google.com/store/apps/details?id=com.riderx.drivers"
                        if (Platform.OS == 'android') {
                            Linking.openURL(driverAppAndroidUrl)
                        } else if (Platform.OS == 'ios') {
                            Linking.openURL(driverAppiOSUrl)
                        }
                    }}>Install Driver App</CustomButton>

                    <View
                        style={{ flex: 1, justifyContent: 'flex-end', marginBottom: hp(1) }}>
                        <TouchableOpacity onPress={openLangModal}>
                            <CustomText style={styles.text}>{currentLabel}</CustomText>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.rowVersion}>
                        <CustomText style={styles.textVersion}>
                            {t('appVersion')}
                        </CustomText>
                        <CustomText style={[styles.textSignu, {
                            fontSize: wp(3.6), fontFamily: 'arial',
                        }]}>
                            {version}
                        </CustomText>
                    </View>
                </View>
            </KeyboardAwareScrollView>

            <Modal
                visible={langModal}
                transparent
                animationType="fade"
                onRequestClose={() => setLangModal(false)}>
                <View style={styles.backdrop}>
                    <View style={styles.sheet}>
                        <CustomText style={styles.sheetTitle}>
                            {t('selectLanguage')}
                        </CustomText>
                        {LANGS.map(item => (
                            <TouchableOpacity
                                key={item.code}
                                style={styles.optionRow}
                                onPress={() => handleLanguageSelect(item.code, item.rtl)}>
                                <CustomText style={styles.optionText}>
                                    {item.label}
                                    {i18n.language === item.code ? ' ✓' : ''}
                                </CustomText>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.optionRow, { alignItems: 'center' }]}
                            onPress={() => setLangModal(false)}>
                            <CustomText style={[styles.optionText, { color: colors.blue }]}>
                                {t('cancel')}
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </CustomScreen>
    );
};

export default InstallDriverApp;

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(3),
    },
    rowVersion: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    line: {
        height: wp(0.3),
        width: wp(40),
        backgroundColor: colors.neutral200,
    },
    textVersion: {
        color: colors.neutral500,
        marginRight: wp(1),
        fontSize: wp(3.5),
    },
    signUpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: hp(2),
    },
    rowSocial: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: hp(2.5),
    },
    center: {
        width: wp(10),
        height: hp(3),
        justifyContent: 'center',
        alignItems: 'center',
    },
    textOr: {
        color: colors.neutral400,
        fontFamily: 'YaldeviJaffna-Bold',
        fontSize: wp(3.3),
    },
    logoContainer: { alignItems: 'center', marginTop: hp(5) },
    formContainer: { flex: 1, marginTop: hp(3) },
    text: { textAlign: 'center', color: colors.blue },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(2),
        marginLeft: wp(6),
    },
    title: {
        color: colors.neutral900,
        fontFamily: 'YaldeviJaffna-Bold',
        fontSize: wp(10.5),
        width: wp(65),
        marginLeft: wp(4),
        marginTop: hp(3),
        lineHeight: hp(5.5),
    },
    textSignu: {
        textAlign: 'center',
        color: colors.neutral600,
        fontFamily: 'YaldeviJaffna-Bold',
        fontSize: wp(4.5),
    },
    rememberText: {
        marginLeft: wp(1.5),
    },
    socialButton: {
        width: wp(43),
        height: hp(7.5),
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: wp(3),
        marginHorizontal: wp(2),
        borderWidth: wp(0.3),
        borderColor: colors.neutral200,
        flexDirection: 'row',
    },
    buttonRegister: {
        height: hp(4.2),
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: wp(2.5),
        borderWidth: wp(0.3),
        borderColor: colors.neutral200,
        paddingHorizontal: wp(2),
        marginLeft: wp(2),
    },
    textButtonSocial: {
        color: colors.black,
        marginLeft: wp(2),
        fontWeight: 'bold',
    },
    checkbox: {
        width: wp(5.5),
        height: wp(5.5),
        borderRadius: wp(20),
        borderWidth: 2,
        borderColor: '#9AA0A6',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkboxChecked: { borderColor: colors.blue },
    checkboxDot: {
        width: wp(3.6),
        height: wp(3.6),
        borderRadius: wp(20),
        backgroundColor: colors.blue,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        paddingHorizontal: wp(6),
        paddingTop: hp(2),
        paddingBottom: hp(3),
        borderTopLeftRadius: wp(6),
        borderTopRightRadius: wp(6),
    },
    sheetTitle: { fontSize: wp(4.3), marginBottom: hp(1.5) },
    optionRow: {
        paddingVertical: hp(1.8),
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    optionText: { fontSize: wp(4) },
    appleRow: {
        marginTop: hp(3),
        alignItems: 'center',
    },
    appleButton: {
        width: wp(89),
        height: hp(6),
        borderRadius: 8,
    },
});
