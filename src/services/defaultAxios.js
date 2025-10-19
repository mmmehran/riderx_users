import axios from "axios";
import store from "../redux/store";
import errorHandler from '../utils/errorHandler';

const instance = axios.create();
const instanceWithAuthorization = axios.create();
const emptyInstance = axios.create();

store.subscribe(() => {
   const accessToken = store.getState().auth.token
   updateAuthToken(accessToken);
});

export const setConfigTest = () => {
   instance.defaults.baseURL = "https://t3.riderx.me/api/v1/"
   instanceWithAuthorization.defaults.baseURL = "https://t3.riderx.me/api/v1/"
};

export const setConfig = () => {
   instance.defaults.baseURL = "https://gearbox.riderx.me/api/v1/"
   instanceWithAuthorization.defaults.baseURL = "https://gearbox.riderx.me/api/v1/"
};

export const addContentTypeFormData = () => {
   instanceWithAuthorization.defaults.headers.post["Content-Type"] = "multipart/form-data"
};

export const addContentTypeJson = () => {
   instanceWithAuthorization.defaults.headers.post["Content-Type"] = "application/json"
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
