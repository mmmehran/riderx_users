// src/screens/auth/ResetPasswordOtp.js
import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';

import CustomScreen from '../../components/common/CustomScreen';
import CustomText from '../../components/common/CustomText';
import CustomButton from '../../components/common/CustomButton';
import colors from '../../config/colors';
import { ArrowLeft2 } from '../../../assets/svg/index';

import { postData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import { showToast } from '../../utils/helpers';
import { setConfigTest, setConfig } from '../../services/defaultAxios';
import routes from '../../navigation/routes';
import { applyLanguage } from '../../utils/i18n';
import { login } from '../../redux/reducers/authenticationReducer';
import { useDispatch } from 'react-redux';
import { trackLogin } from '../../utils/webengage';

const ResetPasswordOtp = route => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const rt = useRoute();

  const isPhoneOtp = rt?.params?.is_phone_otp


  const OTP_LEN = 6;

  const [loading, setLoading] = useState(false);
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''));

  // refs for inputs
  const r0 = useRef(null);
  const r1 = useRef(null);
  const r2 = useRef(null);
  const r3 = useRef(null);
  const r4 = useRef(null);
  const r5 = useRef(null);
  const refs = [r0, r1, r2, r3, r4, r5];

  const code = digits.join('');

  const dispatch = useDispatch()

  const focusAt = idx => {
    const ref = refs[idx]?.current;
    ref && ref.focus();
  };

  const resendCode = async () => {
    try {
      setLoading(true);
      Keyboard.dismiss();
      if (!isPhoneOtp) {
        const email = route?.route?.params?.email;
        if (/^[^@\s]+@bb\.com$/i.test(email)) setConfigTest();
        else setConfig();
      }
      await new Promise(r => setTimeout(r, 300));
      if (isPhoneOtp) {
        const response = await postData(
          urls.OTPREQUEST,
          { phone: rt.params.phone },
          false,
        );
        if (response?.data?.status) showToast(response?.data?.message);
        else errorHandler(response);
      } else {
        const response = await postData(
          urls.RESETPASSWORD,
          { email, type: 'app' },
          false,
        );
        if (response?.data?.status) showToast(response?.data?.message);
        else errorHandler(response);
      }
    } catch (e) {
      errorHandler(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text, idx) => {
    // paste handling (fill forward)
    if (text.length > 1) {
      const onlyNums = text.replace(/\D/g, '').slice(0, OTP_LEN);
      const next = [...digits];
      for (let i = 0; i < OTP_LEN; i++) next[i] = onlyNums[i] ?? '';
      setDigits(next);
      const firstEmpty = next.findIndex(v => v === '');
      if (firstEmpty === -1) Keyboard.dismiss();
      else focusAt(firstEmpty);
      return;
    }

    // single char type / delete
    const ch = text.replace(/\D/g, '');
    const next = [...digits];

    if (ch === '') {
      // delete: clear and back-focus
      next[idx] = '';
      setDigits(next);
      if (idx > 0) focusAt(idx - 1);
      return;
    }

    next[idx] = ch;
    setDigits(next);
    if (idx < OTP_LEN - 1) focusAt(idx + 1);
    else Keyboard.dismiss();
  };

  const handleKeyPress = (e, idx) => {
    const key = e.nativeEvent.key;
    if (key === 'Backspace' || key === 'Delete') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        setDigits(next); // clear current, keep focus
      } else if (idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        setDigits(next);
        focusAt(idx - 1); // jump back
      }
    }
  };

  const handleContinue = async () => {
    if (code.length < OTP_LEN) {
      showToast(t(`Please enter the ${OTP_LEN}-digit code`));
      return;
    }
    if (isPhoneOtp) {
      setLoading(true);
      Keyboard.dismiss();
      await new Promise(r => setTimeout(r, 300));
      const f = { ...rt.params.phone }
      delete f["full"]
      const response = await postData(
        urls.OTPLOGIN,
        { phone: f, code },
        false,
      );
      if (response?.data?.status) {
        if (response?.data?.data) {
          if (response.data.data.language) {
            applyLanguage(response.data.data.language);
          }
          dispatch(login(response?.data?.data));
          trackLogin(response?.data?.data);
        }
        showToast(response?.data?.message);
      } else {
        errorHandler(response);
      }
      setLoading(false);
    } else {
      navigation.navigate(routes.RESETPASSWORD, {
        code,
        email: route?.route?.params?.email,
      });
    }
  };

  return (
    <CustomScreen>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.buttonBack}>
          <ArrowLeft2 />
        </TouchableOpacity>

        <CustomText style={styles.title}>{t('Verification')}</CustomText>
        <CustomText style={styles.title1}>
          {t('verificationContnet')}
          {'  '}
          {route?.route?.params?.email ?? rt?.params?.phone?.full}
        </CustomText>

        {/* OTP 6 cells */}
        <View style={styles.otpRow}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.9}
              onPress={() => focusAt(i)}
              style={[styles.otpBox, digits[i] ? styles.otpBoxFilled : null]}>
              <TextInput
                ref={refs[i]}
                value={digits[i]}
                onChangeText={txt => handleChange(txt, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                // 🔑 Android backspace reliability
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'default'}
                inputMode="numeric"
                // Autofill/one-time code hints
                importantForAutofill="auto"
                textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'none'}
                autoComplete={
                  Platform.OS === 'android' ? 'one-time-code' : 'off'
                }
                disableFullscreenUI
                maxLength={1}
                returnKeyType="done"
                blurOnSubmit={false}
                style={styles.otpInput}
                textAlign="center"
                autoCorrect={false}
                autoCapitalize="none"
                selectionColor={colors.blue}
                {...(i === 0 ? { autoFocus: true } : {})}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue */}
        <View style={styles.formContainer}>
          <CustomButton
            onPress={handleContinue}
            loading={loading}
            disabled={loading || code.length < OTP_LEN}>
            {t('continue')}
          </CustomButton>
        </View>

        {/* Resend */}
        <TouchableOpacity style={styles.signUpContainer} onPress={resendCode}>
          <CustomText style={styles.textSignu}>{t('dontrecieve')} </CustomText>
          <CustomText style={[styles.textSignu, { color: colors.neutral900 }]}>
            {t('resend')}
          </CustomText>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </CustomScreen>
  );
};

export default ResetPasswordOtp;

const styles = StyleSheet.create({
  buttonBack: {
    width: wp(10),
    height: wp(10),
    borderColor: colors.neutral200,
    borderWidth: wp(0.3),
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1),
    marginLeft: wp(5),
  },
  title: {
    color: colors.neutral900,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(10.5),
    width: wp(65),
    marginLeft: wp(4),
    marginTop: hp(2),
    lineHeight: hp(5.5),
  },
  title1: {
    color: colors.neutral600,
    fontSize: wp(4),
    width: wp(80),
    marginLeft: wp(4),
    marginTop: hp(1),
  },
  textSignu: {
    textAlign: 'center',
    color: colors.neutral600,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(4),
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
  },

  /* OTP visuals */
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    marginTop: hp(5),
  },
  otpBox: {
    width: wp(13.5),
    height: wp(13.5),
    borderRadius: wp(3),
    backgroundColor: colors.white11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: wp(0.3),
    borderColor: colors.neutral100,
  },
  otpBoxFilled: {
    backgroundColor: '#FFFFFF',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    fontSize: wp(6.2),
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.neutral900,
  },

  formContainer: {
    marginTop: hp(2),
  },
});
