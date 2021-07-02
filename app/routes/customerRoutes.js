const router = require('express').Router();
var customer = require('../controllers/customerController');
const UserValidation = require('../config/uservalidation');

router.post('/customer/add_address',UserValidation.userAuthorized, customer.add_address);
router.post('/customer/customer_address_list', UserValidation.userAuthorized,customer.customer_address_list);
router.post('/customer/address_update', UserValidation.userAuthorized,customer.address_update);
router.post('/customer/address_get', UserValidation.userAuthorized,customer.address_get);
router.post('/customer/address_delete',UserValidation.userAuthorized, customer.address_delete);
router.post('/customer/changePassword', customer.changePassword);
router.post('/customer/profileUpdate',UserValidation.userAuthorized, customer.profileUpdate);
//router.get('/customer/profile', customer.profile);

router.post('/customer/profile',UserValidation.userAuthorized, customer.profile);

module.exports = router;