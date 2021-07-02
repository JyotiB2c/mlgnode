'use strict';
const md5 = require("blueimp-md5");
var User = require('../models/userModel.js');
var jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const multer = require('multer');
var config = require('../config/database');
var constant = require('../config/constant');
var respHelper = require('../common/response');
var commonHelper = require('../common/common');
var modals = require('../models/mainModal');
var ValidationSchema = require('../requestValitor/userValidation');
var constantKey = require('../config/constant');
var common = require('../requestValitor/commonValidation');
var request = require("request");
var { filterAsync, mapAsync } = require("lodasync");
const Op = Sequelize.Op;
var slug = require('slug');
const { get } = require("request");


const storage = multer.diskStorage({
    destination: function (req, file, callback) {
            callback(null, 'app/uploads/profile');
    },

    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
const fileFilter = (file, cb) => {
    if (file.mimetype === "image/jpg" || file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/png") {
        return cb(null, true);
    } else {
        return cb(new Error());
    }
};

var uploadSingle = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        fileFilter(file, cb);
    }
}).single('image');

exports.profile = async function (req, res) {
    try {
        var id = req.body.userId;
      //  id=8;
        var user = await modals.customers.findOne({
            where: { id: id }
        })
        if (user) {
            var data = {};
            data.status = 200;
            data.msg = "user details"
            data.data = {
                "id": user.id,
                "name": user.name,
                "mobile": user.phone,
                "email": user.email,
               // "image": constant.imageURL + "/profile/" + user.profile_pic,
                "address": user.address
            }
            respHelper.msg(res, data);
        }else{
            var data = {};
            data.status = 202;
            data.msg = "user not found";
            respHelper.msg(res, data);
        }

    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
    }
exports.profileUpdate = async function (req, res) {
    try {
    var id = req.body.userId;
   
    //id=8;
    // uploadSingle(req, res, async function (err) {
    //     if (err) {
    //     res.status(200).json({
    //     success: false,
    //     msg: 'Only .png, .jpg, .jpeg format allowed!',
    //     data: null
    //     });
    //     return;
    //     }
    //     if (req.file) {
    //     var updateValues = { name: req.body.name,  phone: req.body.mobile,temp_mobile: req.body.mobile, profile_pic: req.file.filename ,email:req.body.email,address:req.body.address};
    //     }
    //     else {
    //     var updateValues = { name: req.body.name,  phone: req.body.mobile,temp_mobile: req.body.mobile,address:req.body.address};
    //     }
    var updateValues = { name: req.body.name,  phone: req.body.mobile,temp_mobile: req.body.mobile,address:req.body.address};
    
    let user_update_data = await modals.customers.update(updateValues, { where: { id: id } })
    if (user_update_data) {
    var data = {}
    data.status = 200;
    data.msg = "Profile updated successfully";
    data.data = {};
    respHelper.msg(res, data);
    }
    else {
        var data = {};
        data.status = 204;
        data.msg = "User not found with this number";
        data.data = null;
        respHelper.msg(res, data);
    }
    //})
    } catch (ex) {
    var data = {};
    data.status = 500;
    respHelper.msg(res, data);
    }
    }
exports.changePassword = async function(req, res) {
    try {
        const { error, value } = ValidationSchema.changePassword.validate(req.body);
        if (error) {
            var data = {};
            data.status = 400;
            respHelper.msg(res, data);
        } else {
             var userId=req.body.userId;
              
            let user_role = await modals.customers.findOne({ attributes: ['id', 'email', 'password'], where: { id:userId } });
            if (md5(req.body.currentPassword) == user_role.password) {
                if (req.body.newPassword == req.body.confirmPasword) {
                    let updateValues = { password: md5(req.body.newPassword) };
                    var user_update = await modals.customers.update(updateValues, { where: { id: userId } })
                    if (user_update) {
                        var data = {}
                        data.status = 200;
                        data.msg = "password updated successfully";
                        data.data = {};
                        respHelper.msg(res, data);
                    }
                } else {
                    var data = {};
                    data.status = 204;
                    data.msg = 'password/confirm password not matched';
                    data.data = {};
                    respHelper.msg(res, data);
                }

            } else {
                var data = {};
                data.status = 204;
                data.msg = 'current password is wrong';
                data.data = {};
                respHelper.msg(res, data);
            }


        }
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }

}
exports.add_address = async function (req, res) {
    try {
        var address_details = {
            customer_id: req.body.userId,
            shipping_name: req.body.shipping_name,
            shipping_mobile: req.body.shipping_mobile,
            shipping_address: req.body.shipping_address,
            shipping_city: req.body.shipping_city,
            shipping_state: req.body.shipping_state,
            shipping_country: req.body.shipping_country,
            shipping_address_type: req.body.shipping_address_type,
            shipping_address1: req.body.shipping_address1,
            shipping_pincode: req.body.shipping_pincode,
            shipping_address_default: req.body.shipping_address_default
        }
        var get_user = await modals.customer_shipping_address.findAll({
            attributes: ['id'],
            where: {
                customer_id: req.body.userId
            },
        }) 
        if (get_user.length > 0) {
            if (req.body.shipping_address_default == 1) {
                let updateValues = { shipping_address_default: 0 };
                var update_default_address = await modals.customer_shipping_address.update(updateValues, { where: { customer_id: "8" } });
                var create_address = await modals.customer_shipping_address.create(address_details)
                var data = {};
                data.status = 200;
                data.msg = "address submit successfully";
                data.data = create_address;
                respHelper.msg(res, data);

            }
            else {
                var create_address = await modals.customer_shipping_address.create(address_details)
                var data = {};
                data.status = 200;
                data.msg = "address submit successfully";
                data.data = create_address;
                respHelper.msg(res, data);
            }
        }
        else {
            var create_address = await modals.customer_shipping_address.create(address_details)
            var data = {};
            data.status = 200;
            data.msg = "address submit successfully";
            data.data = create_address;
            respHelper.msg(res, data);
        }

    } catch (ex) {
        console.log("=====>", ex)
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}

exports.customer_address_list = async function (req, res) {
    try {
        var obj = req.body;
        var offset = 0;
        var limit = 10;
        if (obj.hasOwnProperty("page")) {
            offset = (req.body.page - 1) * limit;
        }
        var address_list = await modals.customer_shipping_address.findAndCountAll({
            attributes: ['id', 'customer_id', 'shipping_name', 'shipping_mobile', 'shipping_address', 'shipping_city', 'shipping_state', 'shipping_country', 'shipping_address_type', 'shipping_address1', 'shipping_pincode', 'shipping_address_default'],
            where: {
                customer_id: req.body.userId
            },
            offset: offset,
            limit: limit
        })
        var data = {};
        data.status = 200;
        data.success = (address_list) ? true : false;
        data.msg = "address_list"
        data.data = {
            "total_page": Math.ceil(address_list.count / limit),
            "address_list": address_list.rows
        }
        respHelper.msg(res, data)
    } catch (ex) {
        console.log("=====>", ex)
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}

exports.address_get = async function (req, res) {
    try {
      
           
            var update_default_address = await modals.customer_shipping_address.findOne({ where: { id: req.body.id } });
            var data = {};
            data.status = 200;
            data.msg = "address returned  successfully";
            data.data =update_default_address
            respHelper.msg(res, data);
       
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}
exports.address_update = async function (req, res) {
    try {
        if (req.body.shipping_address_default == 1) {
            let updateValues0 = { shipping_address_default: 0 };
            var update_default_address0 = await modals.customer_shipping_address.update(updateValues0, { where: { customer_id: req.body.userId } });
            let updateValues = { shipping_pincode: req.body.shipping_pincode, shipping_address1: req.body.shipping_address1, shipping_address_type: req.body.shipping_address_type, shipping_country: req.body.shipping_country, shipping_state: req.body.shipping_state, shipping_name: req.body.shipping_name, shipping_city: req.body.shipping_city, shipping_mobile: req.body.shipping_mobile, shipping_address: req.body.shipping_address, shipping_address_default: req.body.shipping_address_default };
            var update_default_address = await modals.customer_shipping_address.update(updateValues, { where: { id: req.body.id, customer_id:req.body.userId } });
            var data = {};
            data.status = 200;
            data.msg = "updated successfully";
            data.data = {};
            respHelper.msg(res, data);
        }
        else {
            let updateValues = { shipping_pincode: req.body.shipping_pincode, shipping_address1: req.body.shipping_address1, shipping_address_type: req.body.shipping_address_type, shipping_country: req.body.shipping_country, shipping_state: req.body.shipping_state, shipping_name: req.body.shipping_name, shipping_city: req.body.shipping_city, shipping_mobile: req.body.shipping_mobile, shipping_address: req.body.shipping_address, shipping_address_default: req.body.shipping_address_default };
            var update_default_address = await modals.customer_shipping_address.update(updateValues, { where: { id: req.body.id, customer_id:req.body.userId } });
            var data = {};
            data.status = 200;
            data.msg = "updated successfully";
            data.data = {};
            respHelper.msg(res, data);
        }
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}

exports.address_delete = async function (req, res) {
    try {
          var delete_address = await modals.customer_shipping_address.destroy({
            where: {
                id: req.body.id
            },
        })
        if (delete_address) {
            var data = {};
            data.status = 200;
            data.msg = "Address deleted successfully"
            data.data = {}
            respHelper.msg(res, data);
        } else {
            var data = {};
            data.status = 200;
            data.msg = "not found"
            data.data = {}
            respHelper.msg(res, data);
        }

    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}

