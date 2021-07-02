const router = require('express').Router();
var user = require('../controllers/userController');
var home = require('../controllers/homeController');
const UserValidation = require('../config/uservalidation');

router.post('/user/login', user.loginC);
router.post('/user/loginOtp', user.loginOtp);
router.post('/user/registration', user.registrationC);
router.post('/user/verifyMobileNumber', user.mainRegistrationC);
router.post('/user/forgotPassword', user.forgotPasswordC);
router.post('/user/resendOtp', user.resendOtpC);

router.get('/user/navigation', user.navigation);
router.post('/sliders', home.slider);
router.post('/cities', home.cities);
router.post('/pincode', home.pincode);

router.get('/siteData', home.siteData);
router.post('/subscribe', home.subscribe);
//router.get('/page_details/:page_url', home.page_details);
router.post('/page_details', home.page_details);
router.get('/homeCategory',home.homeCategory);
router.post('/haveQuery',home.haveQuery);
router.get('/HomeProducttab',home.HomeProducttab);
router.get('/advertisment',home.advertisment);
router.post('/homeProducts',home.homeProducts);
router.post('/searchProduct',home.searchProduct);

router.get('/faqs',home.faqs);
router.get('/ourTeam',home.ourTeam);
router.post('/contactus',home.contactus);

// router.post('/user/send_otp', user.send_otp);

module.exports = router;  