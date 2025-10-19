import RNOtpVerify from 'react-native-otp-verify';

export const getHash = async () => {
    try {
        const hashCode = await RNOtpVerify.getHash()
        return hashCode[0]

    } catch (error) {
        console.log(error)
    }
}

export default {
    getHash
};



