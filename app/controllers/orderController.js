'use strict';

const { Sequelize } = require('sequelize');
var config = require('../config/database');
var jwt = require('jsonwebtoken');
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
const { get } = require("request");
var  { 
    mapAsync, 
    flowAsync, 
    filterAsync, 
    flatMapAsync, 
    uniqByAsync, 
    getAsync, 
  } =require("lodasync");
  exports.list = async function(req, res) {
    try {
        var userId = req.body.userId;
       
        var obj = req.body;
        var offset = 0;
        var limit = 10;
        if (obj.hasOwnProperty("page")) {
            offset = (req.body.page - 1) * limit;
        }
        var user_order = await modals.orderDetails.findAndCountAll({
                    attributes: [
                    'id', 
                            'order_id',
                            'suborder_no',
                            'product_id',
                            'product_name',
                            'product_qty',
                            'product_price',
                            'product_price_old',
                            'order_shipping_charges',
                            'order_cod_charges',
                            'order_coupon_amount',
                            'order_wallet_amount',
                            'order_date',
                            'order_status'
                ],
                where: {
                    order_status:req.body.listType
                },
                include:{
                    model:modals.orders,
                    required: true,
                    attributes: [
                            'id',
                    ],
                    where: {
                      customer_id:userId
                    },
                  
                },
         	order: [
                ['id', 'desc']
            ],
            offset: offset,
            limit: limit
        });

       
        var result = [];
        result = user_order.rows.map(function(obj) {
            let r = {
                "main_order_id": obj.order_id,
                "sub_order_id": obj.id,
                "suborder_no": obj.suborder_no,
                "product_id": obj.product_id,
                "product_name": obj.product_name,
                "product_qty": obj.product_qty,
                "product_price": obj.product_price,
                "product_price_old": obj.product_price_old,
                "order_shipping_charges": obj.order_shipping_charges,
                "order_cod_charges": obj.order_cod_charges,
                "order_coupon_amount": obj.order_coupon_amount,
                "order_wallet_amount": obj.order_wallet_amount,
                "order_date": obj.order_date,
                "order_status": obj.order_status,
                "order_delivery_date": obj.order_date
              
            };
            return r;
        });
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "Order list found" : "no order found";
        data.data = {
            "total_page": Math.ceil(user_order.count / limit),
            "orders": result,
        };
        respHelper.msg(res, data);
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
};

exports.details = async function(req, res) {
    try {
       
       
        var orders = await modals.orders.findOne({
            where: {
                id:req.body.main_order_id
            },
            include: {
                model: modals.orders_shipping
            },
        });

        var user_order = await modals.orderDetails.findAndCountAll({
            attributes: [
                'id', 
                'order_id',
                'suborder_no',
                'product_id',
                'product_name',
                'product_qty',
                'product_price',
                'product_price_old',
                'order_shipping_charges',
                'order_cod_charges',
                'order_coupon_amount',
                'order_wallet_amount',
                'order_date',
                'order_status'
            ],
            include: {
                model: modals.products,
                attributes: [
                    'default_image','url'
                ],
            },
            where: {
                 order_id:req.body.main_order_id
            }
        });
        var result = [];
        result = user_order.rows.map(function(obj) {
            let r = {
                "main_order_id": obj.order_id,
                "sub_order_id": obj.id,
                "suborder_no": obj.suborder_no,
                "product_id": obj.product_id,
                "product_name": obj.product_name,
                "url": obj.product.url,
                "product_qty": obj.product_qty,
                "product_price": obj.product_price,
                "product_price_old": obj.product_price_old,
                "order_shipping_charges": obj.order_shipping_charges,
                "order_cod_charges": obj.order_cod_charges,
                "order_coupon_amount": obj.order_coupon_amount,
                "order_wallet_amount": obj.order_wallet_amount,
                "order_date": obj.order_date,
                "order_delivery_date": obj.order_date,
                "order_status": obj.order_status,
                "image": constant.imageURL+"/products/"+obj.product.default_image,
              
            };
            return r;
        });
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "order list found" : "no order found";
        data.data = {
            "mainOrder": orders,
            "subOrders": result,
        };
        respHelper.msg(res, data);
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
};

exports.reason_list = async function (req, res) {
    try {
        var list = await modals.order_cancel_reason.findAndCountAll({
            attributes: ['id', 'reason'],
            where: {
                status: '1',
                isdeleted: '0',
                reason_type: req.body.reason_type
            }
        })
        var data = {};
        data.status = 200;
        data.success = (list.count > 0) ? true : false;
        data.msg = (list.count > 0) ? "Order list found" : "No order found";
        data.data = list.rows
        respHelper.msg(res, data);
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}

exports.cancel_order = async function (req, res) {
    try {
        let updateValues = { order_status: 4 };
        var update_order_status = await modals.orderDetails.update(updateValues, { where: { id: req.body.sub_order_id } })
        var cancel_reason = {
            sub_order_id: req.body.sub_order_id,
            reason: req.body.reason,
            type: 0,
            return_type: 0
        }
        var submit_cancel = await modals.cancel_return_refund_order.create(cancel_reason)
        var data = {};
        data.status = 200;
        data.msg = "Order canclled"
        data.data ={};
        respHelper.msg(res, data);
    } catch (ex) {
        console.log("eeee",ex)
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}
