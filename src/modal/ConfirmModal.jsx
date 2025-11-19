/* eslint-disable prettier/prettier */
import React, {memo, useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';

import CustomModal from '../components/common/CustomModal'; // same wrapper you already use
import CustomText from '../components/common/CustomText';
import colors from '../config/colors';
import CustomInput from '../components/common/CustomInput';
import {CancelIcon2} from '../../assets/svg/index';

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

  const [pin, setPin] = useState(null);
  return (
    <CustomModal
      isVisible={isVisible}
      style={styles.modal}
      backdropOpacity={0.5}
      onBackdropPress={onCancel}>
      <View style={styles.container}>
        <View style={styles.rowHeader}>
          <TouchableOpacity onPress={onCancel}>
            <CancelIcon2 width={wp(6.5)} height={wp(6.5)}></CancelIcon2>
          </TouchableOpacity>
          <CustomText style={styles.title}>{t('sureCancel')}</CustomText>
        </View>
        <View style={styles.line}> </View>
        <CustomText style={styles.message}>{t('areYouSureCancel')}</CustomText>
        {securePinShow && (
          <View>
            <CustomText style={[styles.title, {marginTop: hp(2)}]}>
              {t('enterPin')} :
            </CustomText>
            <CustomInput
              onChangeText={text => setPin(text)}
              stylesInput={styles.input}
              keyboardType="numeric"
              inputMainStyle={{
                width: wp(50),
                textAlign: 'center',
              }}></CustomInput>
          </View>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.closeButton]}
            disabled={securePinShow && pin?.length !== 5}
            onPress={() => {
              if (securePinShow) {
                onConfirm(pin);
              } else {
                onConfirm();
              }
            }}>
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <CustomText style={styles.closeText}>{t('yesCancel')}</CustomText>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
});
