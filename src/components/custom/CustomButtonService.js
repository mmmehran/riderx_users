import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import colors from '../../config/colors';
import CustomText from '../common/CustomText';
import { Info, Tick} from '../../../assets/svg/index';

const CustomButtonService = ({setService,service,data}) => {

    return (
        <TouchableOpacity
        onPress={() => setService(data)}
        style={styles.serviceButton}>
        <View style={styles.left}>
          <CustomText style={styles.textTop}>{data?.name}</CustomText>
          <Info />
        </View>
        <View style={styles.right}>
          {data?.id == service?.id ? (
            <Tick />
          ) : (
          <View style={styles.tickContainer}></View>
          )}
        </View>
      </TouchableOpacity>
    )
}

export default CustomButtonService

const styles = StyleSheet.create({
   serviceButton: {
    width: wp(90),
    height: hp(10),
    backgroundColor: colors.white,
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderWidth: wp(1),
    borderColor: colors.black,
    flexDirection: 'row',
  },
  textTop: {
    fontSize: wp(7),
    fontWeight: 'bold',
  },
  left: {
    justifyContent: 'flex-end',
    marginLeft: wp(2),
    marginBottom: hp(0.5),
  },
  right: {
    justifyContent: 'center',
    flex: 1,
    alignItems: 'flex-end',
    marginRight: wp(6),
  },
  tickContainer: {
    width: wp(5),
    height: wp(5),
    borderWidth: wp(0.8),
    borderColor: colors.black,
    borderRadius: wp(0.8),
  },
});