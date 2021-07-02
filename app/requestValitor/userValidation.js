const Joi = require('joi');

const UserLogin = Joi.object().keys({
    res_token:Joi.string().required(),
    otp: Joi.number().integer().required(),
});
const UserReg = Joi.object().keys({
    name:Joi.string().required(),
    mobileNumber: Joi.number().integer().required(),
    email: Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    //password: Joi.string().required(),
});
const UserVerifyReg = Joi.object().keys({  
    res_token: Joi.string().required(),
    otp: Joi.string().required()
});
const ResenOtp = Joi.object().keys({
    res_token: Joi.string().required(),
})
const forgotPassword = Joi.object().keys({ 
    mobileNumber: Joi.number().integer().required(),
})
const changePassword = Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmPasword:Joi.string().required()
})
module.exports = {
    UserLogin,
    UserReg,
    UserVerifyReg,
    changePassword,
    forgotPassword,
    ResenOtp
}