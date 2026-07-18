import WebEngage from 'react-native-webengage';
import WebEngagePlugin from 'react-native-webengage/types';

var webengage: WebEngagePlugin = new WebEngage();


export const trackLogin = (userData) => {
    if (!userData || !userData?.user_id) {
        console.warn('[WebEngage] trackLogin failed: No user_id found in userData');
        return;
    }
    // Identify the user
    webengage.user.login(String(userData?.user_id));
    webengage.user.setAttribute("user_type", userData?.is_rider ? 'rider' : 'sender');

    // Set user attributes
    if (userData.email) {
        webengage.user.setEmail(userData?.email);
    }

    if (userData.phone) {
        const phone = `${userData?.phone?.country_code}${userData?.phone?.number}`;
        // WebEngage expects phone in E.164 format if possible
        webengage.user.setPhone(phone);
    }

    // Set other custom attributes if needed
    if (userData.first_name) {
        webengage.user.setFirstName(userData?.first_name);
    }
    if (userData.last_name) {
        webengage.user.setLastName(userData?.last_name);
    }
    if (userData.gender) {
        webengage.user.setGender(userData?.gender);
    }

};

export const trackLogout = () => {
    webengage.user.logout();

};