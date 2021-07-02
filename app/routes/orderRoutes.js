const router = require('express').Router();
var order = require('../controllers/orderController');
const UserValidation = require('../config/uservalidation');

//router.post('/user/order/list', order.list);
router.post('/user/order/details', order.details);
router.post('/user/order/reason_list', order.reason_list);
router.post('/user/order/cancel_order', order.cancel_order);

router.post('/user/order/list',UserValidation.userAuthorized, order.list);


module.exports = router;  