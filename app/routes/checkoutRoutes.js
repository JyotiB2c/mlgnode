const router = require('express').Router();
var checkoutController = require('../controllers/checkoutController');
const UserValidation = require('../config/uservalidation');

router.post('/cart/cartActions',  checkoutController.cartActions);
router.post('/cart/cartList', checkoutController.cartList);
router.post('/cart/checkout',UserValidation.userAuthorized, checkoutController.checkout);
router.post('/cart/applyCoupon',UserValidation.userAuthorized, checkoutController.applyCoupon);
router.post('/cart/cartDelete', checkoutController.cartDelete);
module.exports = router;  