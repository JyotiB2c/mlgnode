const { string } = require('joi');
const Joi = require('joi');
const { password } = require('../config/database');

const PageSchema = Joi.object().keys({
    f_name: Joi.string().alphanum().min(3).max(30).required(),
    birthyear: Joi.number().integer().min(1970).max(2013),
});

const cart = Joi.object().keys({
        prd_id: Joi.number().integer().required(),
        userCokkie: Joi.string().required(),
        action_type: Joi.number().integer().min(0).max(2).required(),
        qty: Joi.required(),
        size_id: Joi.number().integer(),
        color_id: Joi.number().integer(),
        product_variant:Joi.required(),
        remarks:Joi.string()
});

const wishlist = Joi.object().keys({
    prd_id: Joi.number().integer().required(),
    user_id: Joi.number().integer().required(),
    action_type: Joi.number().integer().min(0).max(1).required()
});
const applyCoupon = Joi.object().keys({
    couponCode: Joi.string().required(),
    userId: Joi.required(),
    orderTotal: Joi.required()
})
module.exports = {
    applyCoupon,
    PageSchema,
    cart,
    wishlist
    
}