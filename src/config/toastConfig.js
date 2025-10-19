import React from "react";
import { View, Text } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import colors from "./colors";
import { ErrorIcon, SuccessIcon } from '../../assets/svg/index';

const toastConfig = {
   success: ({ text2 }) => (
      <View
         style={{
            width: wp(89),
            backgroundColor: colors.green,
            borderRadius: wp(1.5),
            justifyContent: "center",
            alignItems: "left",
            marginTop: hp(2),
            elevation: wp(0.2),
            paddingHorizontal: wp(6),
            borderColor: colors.green,
            borderWidth: wp(0),
            borderRightWidth: wp(2),
            paddingVertical: hp(0.8),
            flexDirection: "row",
            alignItems: "center",
         }}
      >
         <SuccessIcon width={wp(6)} height={wp(6)}></SuccessIcon>
         <Text
            style={{
               fontSize: wp(3.5),
               color: colors.white,
               textAlign: "left",
               fontWeight: "bold",
               lineHeight: hp(2.3),
               fontFamily: "Poppins-Regular",
               marginLeft: wp(2)
            }}
         >
            {text2}
         </Text>
      </View>
   ),
   error: ({ text2 }) => (
      <View
         style={{
            width: wp(89),
            backgroundColor: colors.red,
            borderRadius: wp(1.5),
            justifyContent: "center",
            alignItems: "left",
            marginTop: hp(2),
            elevation: wp(0.2),
            paddingHorizontal: wp(6),
            borderColor: colors.red,
            borderWidth: wp(0),
            borderRightWidth: wp(2),
            paddingVertical: hp(0.8),
            flexDirection: "row",
            alignItems: "center",
         }}
      >
         <ErrorIcon width={wp(6)} height={wp(6)}></ErrorIcon>
         <Text
            style={{
               fontSize: wp(3.5),
               color: colors.white,
               textAlign: "left",
               fontWeight: "bold",
               lineHeight: hp(2.3),
               fontFamily: "Poppins-Regular",
               marginLeft: wp(2)
            }}
         >
            {text2}
         </Text>
      </View>
   ),
   warning: ({ text2 }) => (
      <View
         style={{
            width: wp(89),
            backgroundColor: "#ff8800ff",
            borderRadius: wp(1.5),
            justifyContent: "center",
            alignItems: "left",
            marginTop: hp(2),
            elevation: wp(0.2),
            paddingHorizontal: wp(6),
            borderColor: "#ff8800ff",
            borderWidth: wp(0),
            borderRightWidth: wp(2),
            paddingVertical: hp(0.8),
            flexDirection: "row",
            alignItems: "center",
         }}
      >
         <ErrorIcon width={wp(6)} height={wp(6)}></ErrorIcon>
         <Text
            style={{
               fontSize: wp(3.5),
               color: colors.white,
               textAlign: "left",
               fontWeight: "bold",
               lineHeight: hp(2.3),
               fontFamily: "Poppins-Regular",
               marginLeft: wp(2)
            }}
         >
            {text2}
         </Text>
      </View>
   ),
};

export default toastConfig;
