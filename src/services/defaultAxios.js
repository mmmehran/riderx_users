import axios from "axios";
import { API_URL_TEST, API_URL_PROD } from "@env";
import store from "../redux/store";
import errorHandler from '../utils/errorHandler';
import { version } from '../../package.json';
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info';


const instance = axios.create();
const instanceWithAuthorization = axios.create();
const emptyInstance = axios.create();

store.subscribe(() => {
   const accessToken = store.getState().auth.token
   const emailUser = store.getState().auth.email
   updateAuthToken(accessToken);
   addEmailUser(emailUser);
});

export const addEmailUser = (email) => {
   if (email)
      instanceWithAuthorization.defaults.headers.common["user-email"] = email
};

export const setConfigTest = () => {
   instance.defaults.baseURL = API_URL_TEST
   instance.defaults.headers.common["app"] = "user"
   instance.defaults.headers.common["app-version"] = version
   instance.defaults.headers.common["app-platform"] = Platform?.OS
   instance.defaults.headers.common["app-platform-version"] = DeviceInfo.getBuildNumber()
   instanceWithAuthorization.defaults.baseURL = API_URL_TEST
   instanceWithAuthorization.defaults.headers.common["app"] = "user"
   instanceWithAuthorization.defaults.headers.common["app-version"] = version
   instanceWithAuthorization.defaults.headers.common["app-platform"] = Platform?.OS
   instanceWithAuthorization.defaults.headers.common["app-platform-version"] = DeviceInfo.getBuildNumber()
};

export const setConfig = () => {
   instance.defaults.baseURL = API_URL_PROD
   instance.defaults.headers.common["app"] = "user"
   instance.defaults.headers.common["app-version"] = version
   instance.defaults.headers.common["app-platform"] = Platform?.OS
   instance.defaults.headers.common["app-platform-version"] = DeviceInfo.getBuildNumber()
   instanceWithAuthorization.defaults.baseURL = API_URL_PROD
   instanceWithAuthorization.defaults.headers.common["app"] = "user"
   instanceWithAuthorization.defaults.headers.common["app-version"] = version
   instanceWithAuthorization.defaults.headers.common["app-platform"] = Platform?.OS
   instanceWithAuthorization.defaults.headers.common["app-platform-version"] = DeviceInfo.getBuildNumber()
};

export const addContentTypeFormData = () => {
   instanceWithAuthorization.defaults.headers.post["Content-Type"] = "multipart/form-data"
};

export const addContentTypeJson = () => {
   instanceWithAuthorization.defaults.headers.post["Content-Type"] = "application/json"
};

export const addContentTypeJsonAuth = () => {
   instance.defaults.headers.post["Accept"] = "application/json"
};



//updates authorization token in request header, this function is called whenever we refresh access token
export const updateAuthToken = (newToken) => {
   if (newToken)
      instanceWithAuthorization.defaults.headers.common["Authorization"] =
         "token " + newToken;
};

//sets initial authorization header, this function doesn't have any effect if user is not logged in
export const addAuthorization = () => {
   let token = store.getState().auth.token;
   if (token)
      instanceWithAuthorization.defaults.headers.common["Authorization"] =
         "token " + token;
};

export const axiosSetup = (axiosInstance) => {
   axiosInstance.interceptors.request.use(
      (req) => {
         return req;
      },
      (error) => {
         errorHandler(error);
         return error;
      }
   );

   axiosInstance.interceptors.response.use(
      (res) => {
         return res;
      },
      (error) => {
         errorHandler(error);
         return error;
      }
   );
};


addAuthorization();
axiosSetup(instance);
axiosSetup(instanceWithAuthorization);
axiosSetup(emptyInstance);


const defaultAxios = {
   axiosSetup,
   instance,
   addAuthorization,
   instanceWithAuthorization,
   emptyInstance
};
export default defaultAxios;
