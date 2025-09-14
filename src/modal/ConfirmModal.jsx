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

import CustomModal from '../components/common/CustomModal'; // same wrapper you already use
import CustomText from '../components/common/CustomText';
import colors from '../config/colors';
import CustomInput from '../components/common/CustomInput';

const PRIMARY = colors?.primary || '#0B5FFF';
const DANGER = colors?.danger || '#D32F2F';
const BLACK = colors?.black || '#1A1A1A';
const WHITE = colors?.white || '#FFFFFF';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

const ConfirmActionModal = ({
  isVisible,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
  loading = false,
  securePinShow,
}) => {
  const [pin, setPin] = useState(null);
  return (
    <CustomModal
      isVisible={isVisible}
      backdropOpacity={0}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}>
      <View style={styles.container}>
        <CustomText style={styles.title}>{title}</CustomText>
        {!!message && <CustomText style={styles.message}>{message}</CustomText>}
        {securePinShow && (
          <View>
            <CustomText style={[styles.title, {marginTop: hp(2)}]}>
              Enter secure pin :
            </CustomText>
            <CustomInput
              onChangeText={text => setPin(text)}
              stylesInput={styles.input}
              inputMainStyle={{
                width: wp(50),
                textAlign: 'center',
              }}></CustomInput>
          </View>
        )}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost]}
            onPress={onCancel}
            disabled={loading}
            activeOpacity={0.8}>
            <CustomText style={styles.btnGhostText}>{cancelText}</CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnSolid,
              pin?.length !== 5 && styles.btnDisabled,
            ]}
            onPress={() => {
              if (securePinShow) {
                onConfirm(pin);
              } else {
                onConfirm();
              }
            }}
            disabled={pin?.length !== 5}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <CustomText style={styles.btnSolidText}>{confirmText}</CustomText>
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
    width: wp(82),
    backgroundColor: WHITE,
    borderRadius: wp(2),
    paddingVertical: hp(2.2),
    paddingHorizontal: wp(5),
    alignItems: 'center',
  },
  input: {
    width: wp(60),
    height: hp(4),
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(4),
    color: colors.black,
    textAlign: 'center',
    marginBottom: hp(1),
  },
  message: {
    marginTop: hp(1.2),
    fontSize: wp(3.8),
    color: GRAY,
    textAlign: 'center',
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
});
