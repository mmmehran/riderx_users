import { showError } from "./helpers";
import { nouns } from '../enums/nouns';
import store from "../redux/store";
import { logout } from "../redux/reducers/authenticationReducer";
import { logouConfig } from "../redux/reducers/configReducer";


export const errorHandler = async (error) => {

   // console.log(error?.response?.data)

   if (error?.response?.status == 401) {
      showError("Please login or signup again");
      store.dispatch(logout())
      store.dispatch(logouConfig())
   }
   if (error.message === "Network Error") {
      showError("Network connection error!");

   }
   else {
      showError(error?.response?.data?.message)
   }
};

export default errorHandler;
