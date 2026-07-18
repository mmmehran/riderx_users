import store from "../redux/store";
import { logout } from "../redux/reducers/authenticationReducer";
import refreshToken from "./refreshToken";
import { trackLogout } from "./webengage";

const checkToken = async () => {

   let {
      token,
      expireTokenStart,
      expireTokenEnd
   } = store.getState().auth;

   const totalDuration = expireTokenEnd - expireTokenStart;
   const ninetyPercentDuration = 0.9 * totalDuration;
   const ninetyPercentTimestamp = expireTokenStart + ninetyPercentDuration;
   const nowTime = Math.floor(Date.now() / 1000)

   try {
      if (!token) return;
      else if (expireTokenEnd < nowTime) {
         store.dispatch(logout());
         trackLogout()
      } else if (ninetyPercentTimestamp < nowTime) {
         await refreshToken();
      }
   } catch (e) {
      return false;
   }
};

export default checkToken;
