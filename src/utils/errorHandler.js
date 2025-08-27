import { showError } from "./helpers";
import { nouns } from '../enums/nouns';
import store from "../redux/store";
import { logout } from "../redux/reducers/authenticationReducer";


export const errorHandler = async (error) => {

  // console.log(error)
   if (error?.response?.status == 401) {
      showError("Please login or signup again");
      // store.dispatch(logout())
   }
   if (error.message === "Network Error") {
      showError("Network connection error!");

   }
   //  else if (error?.response?.status == 400) {
   //    console.log(error?.response?.data);
   //    showError(error?.response?.data?.title)
   //  } 
   else {
      showError(error?.data?.error?.error_description)
   }
};

export default errorHandler;
