import express from 'express';
import { userValidations,registerUser,changeAvatarImage,getCurrentUser,loginUser,refreshAccessToken,fetchUser,changeCurrentPassword,loginWithMobile,updateAccountDetails } from '../controller/admin.controller';
const dealerRoutes = express.Router();
dealerRoutes.post("signup",userValidations)


export default dealerRoutes;