import React, {memo} from 'react';
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import CustomModal from '../components/common/CustomModal';
import CustomText from '../components/common/CustomText';
import colors from '../config/colors';

const WHITE = colors?.white || '#FFFFFF';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

const ConfirmCancelDeliveryModal = ({
  isVisible,
  title = 'The customer has cancelled this delivery. Please stop proceeding with the order.',
  confirmText = 'Confirm',
  onConfirm,
  onCancel,
}) => {
  return (
    <CustomModal
      isVisible={isVisible}
      backdropOpacity={0}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}>
      <View style={styles.container}>
        <CustomText style={styles.title}>{title}</CustomText>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSolid]}
            onPress={() => {
              onConfirm();
            }}>
            <CustomText style={styles.btnSolidText}>{confirmText}</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomModal>
  );
};

export default memo(ConfirmCancelDeliveryModal);

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
    lineHeight: hp(2.5),
  },
  message: {
    marginTop: hp(1.2),
    fontSize: wp(3.8),
    color: GRAY,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginTop: hp(1),
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
