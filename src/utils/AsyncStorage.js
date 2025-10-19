import AsyncStorage from '@react-native-async-storage/async-storage';

const storeStorageData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value)
    } catch (e) {
        console.log(e)
    }
};

const getStorageData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key)
        if (value !== null) {
            return value
        }
    } catch (e) {
        console.log(e)
    }
};

const removeStorageData = async (key) => {
    try {
        await AsyncStorage.removeItem(key)
    } catch (e) {
        console.log(e)
    }
};


export default {
    storeStorageData,
    getStorageData,
    removeStorageData
}