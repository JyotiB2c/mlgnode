const router = require('express').Router();
var products = require('../controllers/productController');
const UserValidation = require('../config/uservalidation');

router.post('/products/list', products.productList);
router.post('/products/cross_products', products.cross_products);
router.post('/products/search', products.search);
router.post('/products/details', products.productDetails);
router.post('/products/colorImage', products.colorImage);
router.post('/wishlistActions', products.wishlistActions);
router.post('/occassions', products.occassions);
router.post('/wishlist', products.wishlist);
router.post('/similarProduct', products.similarProduct);
router.post('/rating_submit', products.rating_submit);
module.exports = router;  