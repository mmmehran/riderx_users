/* eslint-disable prettier/prettier */
import React, {memo, useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';

import CustomModal from '../components/common/CustomModal';
import CustomText from '../components/common/CustomText';
import colors from '../config/colors';
import {CancelIcon2} from '../../assets/svg/index';
import CustomButton from '../components/common/CustomButton';

const WHITE = colors?.white || '#FFFFFF';
const BORDER = '#E5E7EB';

const ConfirmActionModal = ({
  isVisible,
  onConfirm,
  onCancel,
  loading = false,
  securePinShow,
}) => {
  const {t} = useTranslation();
  const OTP_LEN = 5;
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''));

  // refs for inputs
  const r0 = useRef(null);
  const r1 = useRef(null);
  const r2 = useRef(null);
  const r3 = useRef(null);
  const r4 = useRef(null);
  const refs = [r0, r1, r2, r3, r4];

  const code = digits.join('');

  const focusAt = idx => {
    const ref = refs[idx]?.current;
    ref && ref.focus();
  };

  const handleChange = (text, idx) => {
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

    const ch = text.replace(/\D/g, '');
    const next = [...digits];

    if (ch === '') {
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
        setDigits(next);
      } else if (idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        setDigits(next);
        focusAt(idx - 1);
      }
    }
  };

  useEffect(() => {
    code?.length === OTP_LEN && Keyboard.dismiss();
  }, [code]);

  return (
    <CustomModal
      isVisible={isVisible}
      style={styles.modal}
      backdropOpacity={0.5}
      onBackdropPress={onCancel}>
      {securePinShow ? (
        <>
          <View style={styles.secureView}>
            <CustomText style={styles.textTop}>
              {t('enterDeliveryPin')}
            </CustomText>
            <CustomText style={styles.textContent}>
              {t('pinContent')}
            </CustomText>
            <View style={styles.otpRow}>
              {[0, 1, 2, 3, 4].map(i => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.9}
                  onPress={() => focusAt(i)}
                  style={[
                    styles.otpBox,
                    digits[i] ? styles.otpBoxFilled : null,
                  ]}>
                  <TextInput
                    ref={refs[i]}
                    value={digits[i]}
                    onChangeText={txt => handleChange(txt, i)}
                    onKeyPress={e => handleKeyPress(e, i)}
                    // 🔑 Android backspace reliability
                    keyboardType={
                      Platform.OS === 'ios' ? 'number-pad' : 'default'
                    }
                    inputMode="numeric"
                    // Autofill/one-time code hints
                    importantForAutofill="auto"
                    textContentType={
                      Platform.OS === 'ios' ? 'oneTimeCode' : 'none'
                    }
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
                    {...(i === 0 ? {autoFocus: true} : {})}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.buttonContainer}>
              <CustomButton
                disabled={code.length < OTP_LEN}
                onPress={() => {
                  onConfirm(code);
                }}
                style={styles.buttonMain}>
                {t('confimedDelivery')}
              </CustomButton>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.container}>
          <View style={styles.rowHeader}>
            <TouchableOpacity onPress={onCancel}>
              <CancelIcon2 width={wp(6.5)} height={wp(6.5)}></CancelIcon2>
            </TouchableOpacity>
            <CustomText style={styles.title}>{t('sureCancel')}</CustomText>
          </View>
          <View style={styles.line}> </View>
          <CustomText style={styles.message}>
            {t('areYouSureCancel')}
          </CustomText>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.closeButton]}
              onPress={() => {
                onConfirm();
              }}>
              {loading ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <CustomText style={styles.closeText}>
                  {t('yesCancel')}
                </CustomText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </CustomModal>
  );
};

export default memo(ConfirmActionModal);

const styles = StyleSheet.create({
  container: {
    width: wp(100),
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(3),
    borderTopRightRadius: wp(3),
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    height: hp(22),
    //  bottom: hp(-2.5),
  },
  secureView: {
    width: wp(100),
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(3),
    borderTopRightRadius: wp(3),
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    height: hp(60),
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: hp(2),
  },
  buttonMain: {
    marginHorizontal: 0,
    marginTop: hp(3),
  },
  input: {
    width: wp(60),
    height: hp(4),
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  line: {
    backgroundColor: colors.neutral200,
    width: wp(92),
    height: wp(0.3),
    marginVertical: hp(2),
  },
  title: {
    fontSize: wp(4.5),
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.neutral900,
    marginLeft: wp(1.5),
  },
  textContent: {
    fontSize: wp(3.5),
    color: colors.neutral900,
    marginLeft: wp(1.5),
    width: wp(70),
    lineHeight: hp(2.5),
    marginTop: hp(1),
  },
  textTop: {
    fontSize: wp(10),
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.neutral900,
    marginLeft: wp(0.5),
    marginTop: hp(5),
  },
  message: {
    color: colors.neutral600,
  },
  row: {
    flexDirection: 'row',
    marginTop: hp(2.2),
    marginBottom: hp(1),
  },
  btn: {
    minWidth: wp(25),
    height: hp(4.5),
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp(2),
    paddingHorizontal: wp(3),
  },
  btnGhost: {
    backgroundColor: colors.red,
    borderWidth: 1,
    borderColor: BORDER,
  },
  btnGhostText: {
    color: colors.white,
    fontSize: wp(3.5),
  },
  btnSolid: {
    backgroundColor: colors.success,
  },
  btnSolidText: {
    color: WHITE,
    fontSize: wp(3.5),
  },
  btnDisabled: {
    opacity: 0.6,
  },
  closeButton: {
    marginTop: hp(2),
    borderRadius: wp(2.3),
    backgroundColor: colors.black,
    width: wp(92),
    height: hp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: wp(4),
    color: colors.white,
    fontFamily: 'YaldeviJaffna-Bold',
  },
  modal: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
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
    marginTop: hp(4),
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
