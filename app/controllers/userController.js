'use strict';
const md5 = require("blueimp-md5");
var User = require('../models/userModel.js');
var jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
var config = require('../config/database');
var constant = require('../config/constant');
var respHelper = require('../common/response');
var commonHelper = require('../common/common');
var modals = require('../models/mainModal');
var ValidationSchema = require('../requestValitor/userValidation');
var constantKey = require('../config/constant');
var common = require('../requestValitor/commonValidation');
var request = require("request");
const Op = Sequelize.Op;
var slug = require('slug');

var  { 
    mapAsync, 
    flowAsync, 
    filterAsync, 
    flatMapAsync, 
    uniqByAsync, 
    getAsync, 
  } =require("lodasync");
exports.loginOtp = async function (req, res) {
    try {
        var user_exits = await modals.customers.findOne({
            attributes: ['email', 'phone','id'],
            where: {
                [Op.or]: [{
                    email: req.body.search
                }, {
                    phone: req.body.search
                }]
            }
        })
        var otp = Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9);
        otp="1234";
        if (user_exits) {
               let updateValues = { otp: otp };
                await modals.customers.update(updateValues, { where: { id: user_exits.id } })
                var mailData = {
                    "email": req.body.search,
                    "otp": otp
                };
                commonHelper.sendOtpMail(mailData);

                var smsData = {
                    "mobileNumber": req.body.search,
                    "otp": otp
                };
                commonHelper.otpMsg(smsData);

                var user_data = {
                    search: req.body.search,
                    otp: otp
                }
                var token = jwt.sign(user_data, constant.secret, {
                    expiresIn: constant.expireIN
                });
                var data = {};
                data.status = 200;
                data.msg = "Verify email Id";
                data.data = token
                respHelper.msg(res, data);
          
           
        }
        else {
            var data = {};
            data.status = 204;
            data.msg = "No user founds with this details";
            respHelper.msg(res, data);
        }
    } catch (ex) {
        console.log("=====>", ex)
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}

exports.loginC = async function (req, res) {
    try {
        const { error, value } = ValidationSchema.UserLogin.validate(req.body);
        if (error) {
            var data = {};
            data.status = 400;
            respHelper.msg(res, data);
        } else {
            jwt.verify(req.body.res_token, config.secret, async function (err, decoded) {
                if (err) {
                    var data = {};
                    data.status = 400;
                    respHelper.msg(res, data);
                } else {
                    var get_user = await modals.customers.findOne({
                        attributes: ['id', 'email', 'phone', 'otp','name','profile_pic'],
                        where: {
                            [Op.or]: [{
                                email: decoded.search
                            }, {
                                phone: decoded.search
                            }]
                        }
                    })
                    if (get_user) {
                        if (req.body.otp == get_user.otp) {
                            var token = jwt.sign({ id: get_user.id }, constant.secret, {
                                expiresIn: constant.expireIN
                            });
                            data = {}
                            data.status = 200;
                            data.msg = "Login successfully done";
                    data.data = {token:token,userId:get_user.id,name:get_user.name,phone:get_user.phone
                                ,image: constant.imageURL+"/customers/profile_pic/"+get_user.profile_pic}
                            respHelper.msg(res, data);

                        }
                        else {
                            var data = {};
                            data.status = 204;
                            data.msg = 'Invalid OTP';
                            respHelper.msg(res, data);
                        }
                    }
                    else {
                        var data = {};
                        data.status = 204;
                        data.msg = "No user founds with this details";
                        respHelper.msg(res, data);
                    }

                }
            })
        }
    } catch (ex) {
        console.log("----------->", ex)
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
};

exports.registrationC = async function (req, res) {
    try {
        const { error, value } = ValidationSchema.UserReg.validate(req.body);
        if (error) {
            var data = {};
            data.status = 400;
            respHelper.msg(res, data);
        } else {
            let user_role = await modals.customers.findOne({
                attributes: ['id', 'email', 'phone'],
                where: {
                    [Op.or]: [{
                        email: req.body.email
                    }, {
                        phone: req.body.mobileNumber
                    }]
                }
            });
            if (user_role) {
                var data = {};
                data.status = 204;
                data.msg = "user already exists with this email/mobile number";
                respHelper.msg(res, data);
            }
            else {
                var user_data = {
                    "name": req.body.name,
                    "mobileNumber": req.body.mobileNumber,
                    "lastName": req.body.lastName,
                    "email": req.body.email,
                    //"password": req.body.password
                };
                var otp = Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9);
                user_data.otp = otp;
                user_data.otp = 1234;
                var mailData1 = {
                    "name": req.body.name,
                    "mobileNumber": req.body.mobileNumber,
                    "otp": user_data.otp
                };
                commonHelper.otpMsg(mailData1);
                var mailData2 = {
					"name": req.body.name,
                    "email": req.body.email,
                    "otp": user_data.otp
                };
                commonHelper.sendOtpMail(mailData2)
                var token = jwt.sign(user_data, constant.secret, {
                    expiresIn: constant.expireIN
                });
                var data = {};
                data.status = 200;
                data.msg = "Verify Phone Number";
                data.data = token;
                respHelper.msg(res, data);
            }

        }
    } catch (ex) {
        console.log("=====>", ex)
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
};

exports.mainRegistrationC = async function (req, res) {
    const transaction = await modals.sequelize.transaction();
    try {
        const { error, value } = ValidationSchema.UserVerifyReg.validate(req.body);
        if (error) {
            var data = {};
            data.status = 400;
            respHelper.msg(res, data);
        } else {
            jwt.verify(req.body.res_token, config.secret, async function (err, decoded) {
                if (err) {
                    var data = {};
                    data.status = 400;
                    respHelper.msg(res, data);
                } else {
                    if (req.body.otp == decoded.otp) {
                        console.log(decoded);
                        var user_data = {
                            "phone": decoded.mobileNumber,
                            "email": decoded.email,
                            "name": decoded.name,
                            "password": decoded.password,
                            "mobile_otp": decoded.otp
                        };
                        let user_role = await modals.customers.findOne({
                            attributes: ['id', 'phone'],
                            where: {
                                [Op.or]: [{
                                    email: decoded.email
                                }, {
                                    phone: decoded.mobileNumber
                                }]
                            }
                        });
                        if (user_role) {
                            var data = {};
                            data.status = 204;
                            data.msg = "user already exists with this email/mobile number";
                            respHelper.msg(res, data);
                        } else {
                            let user_role_obj = {
                                name: decoded.name,
                                email: decoded.email,
                                phone: decoded.mobileNumber,
                                password: md5(decoded.password),
                                mobile_otp: decoded.otp
                            };
                            const user_role1 = await modals.customers.create(user_role_obj, { transaction });
                            await transaction.commit();
                            var token = jwt.sign({ id: user_role1.id }, constant.secret, {
                                expiresIn: constant.expireIN
                            });
                            user_data.id = user_role1.id;
                            user_data.token = token;

                            var mailData = {
                                "mobileNumber": decoded.mobileNumber,
                                "name": decoded.name,
                                //"lastName": decoded.lastName
                            };
                            commonHelper.welcomeMsg(mailData);
                            var data = {};
                            data.status = 200;
                            data.msg = "Verification successfully done";
                            data.data = user_data;
                            respHelper.msg(res, data);
                        }

                    } else {
                        var data = {};
                        data.status = 204;
                        data.msg = 'Invalid OTP';
                        respHelper.msg(res, data);
                    }

                }

            });
        }

    } catch (ex) {
        await transaction.rollback();
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }

};

exports.resendOtpC = function (req, res) {
    try {
        const { error, value } = ValidationSchema.ResenOtp.validate(req.body);
        if (error) {
            var data = {};
            data.status = 400;
            respHelper.msg(res, data);
        } else {
            jwt.verify(req.body.res_token, config.secret, async function (err, decoded) {
                if (err) {
                    var data = {};
                    data.status = 400;
                    respHelper.msg(res, data);
                } else {
                    var otp = Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9);
                    otp=1234;
                    var user_data = {
                        "name": decoded.name,
                        "mobileNumber": decoded.mobileNumber,
                        "email": decoded.email,
                        "password": decoded.password,
                        "otp": otp
                    }
                    var token = jwt.sign(user_data, constant.secret, {
                        expiresIn: constant.expireIN
                    });

                    var mailData1 = {
                        "mobileNumber": decoded.mobileNumber,
                        "otp": otp
                    };
                    commonHelper.otpMsg(mailData1);
                    var mailData2 = {
                        "email": decoded.email,
                        "otp": otp
                    };
                    commonHelper.sendOtpMail(mailData2);
                    var data = {};
                    data.status = 200;
                    data.msg = "OTP SENT";
                    data.data = token;
                    respHelper.msg(res, data);
                }
            })
        }
    }
    catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}

exports.forgotPasswordC = async function (req, res) {
    try {
        const { error, value } = ValidationSchema.forgotPassword.validate(req.body);
        if (error) {
            var data = {};
            data.status = 400;
            respHelper.msg(res, data);
        } else {
            var get_user = await modals.users.findOne({
                attributes: ['id', 'mobileNumber'],
                where: {
                    mobileNumber: req.body.mobileNumber
                }
            });
            if (get_user) {
                var otp = Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9) + '' + Math.floor(Math.random() * 9);

                var user_data = {
                    "mobileNumber": req.body.mobileNumber,
                    "otp": otp
                }
                var mailData = {
                    "mobileNumber": req.body.mobileNumber,
                    "otp": otp
                };
                commonHelper.otpMsg(mailData);
                let updateValues = { mobile_otp: otp };
                await modals.users.update(updateValues, { where: { mobileNumber: get_user.mobileNumber } })

                var token = jwt.sign(user_data, constant.secret, {
                    expiresIn: constant.expireIN
                });

                var data = {};
                data.status = 200;
                data.msg = "OTP sent on your mobile number";
                data.data = token
                respHelper.msg(res, data);

            }
            else {
                var data = {};
                data.status = 204;
                data.msg = "user not found with this number";
                data.data = null;
                respHelper.msg(res, data);
            }
        }
    }
    catch (ex) {
        console.log("--------------", ex)
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}


exports.forgotverifyOtp = async function (req, res) {
    try {
        const { error, value } = ValidationSchema.forgotVerifyOtp.validate(req.body);
        if (error) {
            var data = {};
            data.status = 400;
            respHelper.msg(res, data);
        } else {
            jwt.verify(req.body.res_token, config.secret, async function (err, decoded) {
                if (err) {
                    var data = {};
                    data.status = 400;
                    respHelper.msg(res, data);
                }
                else if (req.body.otp == decoded.otp) {
                    let updateValues = { mobile_verified: 1 };
                    await modals.users.update(updateValues, { where: { mobileNumber: decoded.mobileNumber } })

                    var user_data = {
                        mobileNumber: decoded.mobileNumber
                    }

                    var token = jwt.sign(user_data, constant.secret, {
                        expiresIn: constant.expireIN
                    });
                    var data = {};
                    data.status = 200;
                    data.msg = "OTP verified";
                    data.data = token;
                    respHelper.msg(res, data);
                }
                else {
                    var data = {};
                    data.status = 204;
                    data.msg = 'Invalid OTP';
                    respHelper.msg(res, data);
                }
            })
        }
    }
    catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}

exports.navigation = async function (req, res) {
    try {
        async function getCat(parent_id) {
            var get_parents = await modals.categories.findAll({
                attributes: ['id', 'name', 'parent_id','cat_url'],
                where: {
                    status: 1,
                    isdeleted: 0,
                    parent_id: parent_id
                }
            });   
            return get_parents;
        }
        var basecats = await getCat(1);
        const getbcat = async (obj) => {
            var second_levels = await modals.categories.findAll({
                attributes: ['id', 'parent_id', 'name','cat_url'],
                where: {
                    status: 1,
                    isdeleted: 0,
                    parent_id: obj.id
                },
            })

            const allcats = await mapAsync(getccat, second_levels);
            var res_data = {
                id: obj.id,
                name: obj.name,
                cat_url: obj.cat_url,
                subcats: allcats
            }
            return res_data
        }

        const getccat = async (obj) => {
            var second_level = await modals.categories.findAll({
                attributes: ['id', 'parent_id', 'name','cat_url'],
                where: {
                    status: 1,
                    isdeleted: 0,   
                    parent_id: obj.id
                },
            })
            var res_data = {
                id: obj.id,
                name: obj.name,
                cat_url: obj.cat_url,
                subcats: second_level
            }
            return res_data
        }

        const allcats = await mapAsync(getbcat, basecats);
        var data = {}
        data.status = 200;
        data.msg = "categories details";
        data.data = allcats;
        respHelper.msg(res, data);

    } catch (ex) {
        console.log("========>", ex)
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}

exports.send_otp = async function (req, res) {
    var smsData = {
		"mobileNumber": '9537268854',
		"otp": 1234
    };
    commonHelper.otpMsg_new(smsData);

	var data = {};
	data.status = 200;
	data.msg = "Verify Mobile No";
    data.data = 123
    respHelper.msg(res, data);
}
