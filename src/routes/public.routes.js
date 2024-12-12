import express from 'express';
import { multerUpload } from '../middlewere/multer.middlewere.js';
import { registerUser, loginUser, userValidations, loginWithMobile, loginAdmin } from '../controller/admin.controller.js';
import { sendOtpMobile, verifyMobileOtp, sendOtpEmail, verifyEmailOtp } from '../controller/otp.controller.js';

const router = express.Router();

/*----------------------------------------user api----------------------------------------------------*/
router.post('/signup', multerUpload.single('profileImage'), userValidations, registerUser);
router.post('/login', loginUser);
router.post('/admin-login', loginAdmin);
router.post('/mobile-login', loginWithMobile);

/*-------------------------------------------------------otp--------------------------------------------*/

router.post('/send-mobile-otp', sendOtpMobile);
router.post('/verify-mobile-otp', verifyMobileOtp);
router.post('/send-email-otp', sendOtpEmail);
router.post('/verify-email-otp', verifyEmailOtp);



export default router;