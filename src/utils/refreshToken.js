import {
   renewAccessToken,
} from "../redux/reducers/authenticationReducer";
import store from "../redux/store";
import { refreshAccessToken } from "./../services/refreshToken.service";
import { updateAuthToken } from "../services/defaultAxios";


const refreshToken = async () => {
   try {
      const response = await refreshAccessToken();
      if (response?.data?.status == 1) {
         store.dispatch(renewAccessToken(response?.data?.data));
         updateAuthToken(response?.data?.data?.access_token);
      }
   } catch (e) {
      console.log({ REF: e });
      return false;
   }
};

export default refreshToken;
