'use strict';

const { Sequelize,QueryTypes } = require('sequelize');
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
  exports.cartDelete = async function(req, res) {
    try {
       // const { error, value } = common.cart.validate(req.body);

        await modals.carts.destroy({ where: { user_id: req.body.userCokkie } });
        var data = {};
        data.status = 200;
        data.msg = 'product removed from your cart';
        data.data = {};
        respHelper.msg(res, data);

    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);

    }
};
  exports.applyCoupon = async function (req, res) {
    try {
     const { error, value } = common.applyCoupon.validate(req.body);
        if (error) {
                var data = {};
                data.status = 400;
                respHelper.msg(res, data);
        } else {
            let cpnEixts = await modals.coupons.findOne( {
                        where: { 
                            status:1
                            },
                     include: {
                        model: modals.coupon_details,
                        attributes: [
                            'id'
                        ],
                        required: true,
                        where: { 
                            status:1,
                            coupon_used:0,
                            coupon_code:req.body.couponCode
                         }
                    }
                 }
                 );
            if(!cpnEixts){
                var data = {};
                data.status = 204;
                data.msg = "Invalid coupon";
                data.data ={};
                respHelper.msg(res, data);
                return ;
            }
            if(cpnEixts.coupon_type==3 || cpnEixts.coupon_type==7 || cpnEixts.coupon_type==2 || cpnEixts.coupon_type==6){
                if(cpnEixts.started_date !=null && cpnEixts.end_date!=null){
                    let dateResp= commonHelper.checkCouponDate(cpnEixts);
                       if(!dateResp.error){
                             var data = {};
                             data.status = 204;
                             data.msg = "Invalid coupon";
                             data.data ={};
                             respHelper.msg(res, data);
                             return ;
                    }
                 }
            }


            if(cpnEixts.coupon_type==1 || cpnEixts.coupon_type==3 || cpnEixts.coupon_type==5 || cpnEixts.coupon_type==7){
                let dateResp= commonHelper.checkCartValue(cpnEixts,req.body.orderTotal);
                       if(!dateResp.error){
                             var data = {};
                             data.status = 204;
                             data.msg = "Invalid coupon";
                             data.data ={};
                             respHelper.msg(res, data);
                             return ;
                    }

            }
          
               if(cpnEixts.coupon_for==2){
                let usesperUser= await commonHelper.checkCustomertype(req.body.userId);

                if(usesperUser.count > 0){
                    var data = {};
                    data.status = 204;
                    data.msg = "This coupon invalid for you";
                    data.data ={};
                    respHelper.msg(res, data);
                    return ;
                }
               }
            
                let usesperUser= await commonHelper.usesperUser(req.body.couponCode,req.body.userId);

                if(cpnEixts.uses_per_user<=usesperUser.count){
                    var data = {};
                    data.status = 204;
                    data.msg = "This coupon invalid for you";
                    data.data ={};
                    respHelper.msg(res, data);
                    return ;
                }
    
              let calculatePercentage= commonHelper.calculatePercentage(cpnEixts,value);

                  var data = {};
                data.status = 200;
                data.msg = "coupon applied";
                data.data =calculatePercentage.discount;
                respHelper.msg(res, data); 
               
        }  
            
    }
    catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
}
  exports.cartActions = async function(req, res) {
    try {
        const { error, value } = common.cart.validate(req.body);

        if (1==0) {
            var data = {};
            data.status = 400;
            respHelper.msg(res, data);
        } else {

            if (req.body.action_type == 0 || req.body.action_type == 1) {
                let serviceExist = await modals.products.findOne({ attributes: ['id','qty'], where: { id: req.body.prd_id } });
                if (serviceExist) {

                    if(serviceExist.qty < req.body.qty){
                        var data = {};
                        data.status = 204;
                        data.msg = 'No More Quantity In Stock';
                        data.data = {};
                        respHelper.msg(res, data);
                        return ;
                    }
                    switch (req.body.action_type) {
                        case 0:
                            let user_role = await modals.carts.findOne({ attributes: ['id'], where: { user_id: req.body.userCokkie, prd_id: req.body.prd_id } });
                            if (user_role) {
                                var data = {};
                                data.status = 204;
                                data.msg = 'Product already in your cart';
                                data.data = {};
                                respHelper.msg(res, data);
                            } else {
                                await modals.carts.create({ 
                                        product_variant :req.body.product_variant,
                                        remarks :req.body.remarks,
                                        user_id: req.body.userCokkie,
                                     prd_id: req.body.prd_id, qty: req.body.qty ,size_id:req.body.size_id,color_id:req.body.color_id});
                                var data = {};
                                data.status = 200;
                                data.msg = 'Product added to cart';
                                data.data = {};
                                respHelper.msg(res, data);
                            }


                            break;

                        case 1:
                            await modals.carts.update({ qty: req.body.qty }, { where: { user_id: req.body.userCokkie, prd_id: req.body.prd_id } });
                            var data = {};
                            data.status = 200;
                            data.msg = 'Product updated to cart';
                            data.data = {};
                            respHelper.msg(res, data);
                            break;
                    }

                } else {
                    var data = {};
                    data.status = 204;
                    data.msg = 'Product not exist';
                    data.data = {};
                    respHelper.msg(res, data);
                }
            } else {
                await modals.carts.destroy({ where: { user_id: req.body.userCokkie, prd_id: req.body.prd_id } });
                var data = {};
                data.status = 200;
                data.msg = 'Product removed from your cart';
                data.data = {};
                respHelper.msg(res, data);

            }



        }

    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);

    }
};



exports.cartList = async function(req, res) {
    var serviceCharges = 0;
    var gstPercentage = 0;
    var gstValue = 0;
    var subtotal = 0;
    var total = 0;
    var grandtotal = 0;
    try {
        var offset = 0;
        var limit = 20;
        var user_order = await modals.carts.findAll({
            attributes: [
                'id', 'qty', 'prd_id','product_variant','remarks','size_id','color_id'
            ],
            where: { user_id: req.body.userCokkie },
            include: {
                model: modals.products,
                attributes: [
                    'id', 'name','price','spcl_price','default_image'
                ],
                where: { 
                    status:1,
                    isdeleted:0
                 }
            },
            offset: offset,
            limit: limit,
        })

        

        const getProd = async(obj) => { 
           
                var color=obj.color_id;
                var size=obj.size_id;
            var sizename=await modals.sequelize.query(
                `SELECT 
                            sizes.name
                       FROM sizes
                    WHERE 
                    sizes.id=${size}
                    `,
                {
                  type: QueryTypes.SELECT
                }
              );

              var colorname=await modals.sequelize.query(
                `SELECT 
                       colors.name,
                       colors.color_code
                        FROM colors
                        WHERE 
                        colors.id=${color} `,
                {
                  type: QueryTypes.SELECT
                }
              );
             
              let price=0;

                if(color!=0 && size==0){       
                var usedetai = await modals.product_attributes.findOne({
                    attributes: ['price'],
                    where: { product_id: obj.product.id, color_id: color }
                })
                 price +=usedetai.price;
                
              }
              
                if(color==0 && size!=0){
                var usedetai = await modals.product_attributes.findOne({
                    attributes: ['price'],
                    where: { product_id: obj.product.id, size_id: size }

                })
                 price +=usedetai.price;
                
              }
              if(color!=0 && size!=0){
                var usedetai = await modals.product_attributes.findOne({
                    attributes: ['price'],
                    where: { product_id: obj.product.id, size_id: size,color_id: color }
                })
             
                //console.log("dv",usedetai);
                 price +=usedetai.price;
                
              }

              
              if(color!=0){
                var coloimg = await modals.product_configuration_images.findOne({
                    attributes: ['product_config_image'],
                    where: { product_id: obj.product.id, color_id: color }
                })
           
             var prdimages =constant.imageURL+"/products/"+coloimg.product_config_image;
            }else{
                var prdimages = constant.imageURL+"/products/"+obj.product.default_image;
            }

            let individalTotal = (obj.qty * obj.product.spcl_price);
            total += individalTotal;
            let  cakeType='';
            if(obj.product_variant==1){
             cakeType +='With Egg';
            }
            if(obj.product_variant==2){
                 cakeType +='Eggless';
                }

            var data = {
                "id": obj.product.id,
                "name": obj.product.name,
                "price":  obj.product.spcl_price + price,
                "spcl_price": obj.product.price + price,
                "image":prdimages,
                "qty": obj.qty,
                "sizeName": sizename[0].name,
                "colorName": colorname[0].name,
                "colorCode": colorname[0].color_code,
                "qty": obj.qty,
                "cakeType":cakeType,
                "remarks": obj.remarks,
                "Total": individalTotal
            };
            return data;
        }

        const result = await mapAsync(getProd, user_order)
        subtotal = parseFloat(total + serviceCharges);
        gstValue = (gstPercentage / 100) * subtotal;;
        grandtotal = subtotal + gstValue;

        var data = {};
        data.status = 200;
        data.success = (result.length > 0) ? true : false;
        data.msg = (result.length > 0) ? "Cart list found" : "No products in your cart";
        data.data = {
            "products": result,
            "grandTotalBreakup": {
                "total": parseFloat(total.toFixed(2)),
                "shippingCharges": serviceCharges,
                "subtotal": subtotal,
                "discount": 0,
                "gstPercentage": gstPercentage,
                "gstValue": parseFloat(gstValue.toFixed(2)),
                "grandTotal": parseFloat(grandtotal.toFixed(2))

            }
        };
        respHelper.msg(res, data);
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);

    }
};

exports.checkout = async function(req, res) {

    var cust_id = 0;
    var serviceCharges = req.body.serviceCharges;
    var gstPercentage = 0;
    var gstValue = 0;
    var subtotal = 0;
    var total = 0;
    var grandtotal = 0;
    var orderId =0;
    var discount = (req.body.couponCode=='NA')?'0':req.body.discount;

    console.log(req.body);
  try {

        
        var address = await modals.customer_shipping_address.findOne({  
            where: {
                id:req.body.shipping_id,
                customer_id:req.body.userCokkie,
            },
            offset: offset,
            limit: limit,
        });

        if(!address){
            var data = {};
            data.status = 204;
            data.msg = "Shipping address does not exits"
            respHelper.msg(res, data);
            return ;
        }

        

        var offset = 0;
        var limit = 20;
        var allProducts = await modals.carts.findAll({
            attributes: [
                'id', 'qty', 'prd_id','size_id','color_id'
            ],
            where: { user_id: req.body.userCokkie },
            include: {
                model: modals.products,
                attributes: [
                    'id', 'name','price','qty','spcl_price','status','isdeleted'
                ],
                where: { 
                    status:1,
                    isdeleted:0
                 },
            },
            offset: offset,
            limit: limit,
        })


            if(allProducts.length==0){
            var data = {};
            data.status = 204;
            data.msg = "You have no products in your cart"
            respHelper.msg(res, data);
            return ;
            }

        const invalidProducts = allProducts.filter(obj => obj.product.qty<obj.qty);
            if(invalidProducts.length > 0 ){
                    var data = {};
                    data.status = 204;
                    data.msg = "Some products are out of stock"
                    respHelper.msg(res, data);
                    return ;
            }


       

        var result = [];
            result = allProducts.map(function(obj) {
                let individalTotal = (obj.qty * obj.product.spcl_price);
                total += individalTotal;
                var data = {
                    "product_id": obj.product.id,
                    "product_name": obj.product.name,
                    "price": obj.product.price,
                    "spcl_price": obj.product.spcl_price,
                    "qty": obj.qty,
                    "size_id": obj.size_id,
                    "color_id": obj.color_id,
                };
                return data;
            });

       

        subtotal = parseFloat(total + serviceCharges);
        grandtotal = subtotal-discount;

    

     //   var services = [];
        var totalService = result.length;
        var perDis = (discount / totalService);
        var perSerChar = (serviceCharges / totalService);

            var order = await modals.orders.create({
                customer_id: req.body.userCokkie,
                order_no: 'MLG_ORD_11',
                shipping_id: req.body.shipping_id,
                payment_mode: req.body.paymentMode,
                grand_total:grandtotal,
                coupon_code:(req.body.couponCode=='NA')?'0':req.body.couponCode,
                coupon_percent:0,
                coupon_amount:discount,
                discount_amount: discount,
                total_shipping_charges: serviceCharges,
                cod_charges: 0,
                order_status:0,
                txn_id:  req.body.txn_id,
                txn_status:  req.body.txn_sts,
            });

            await modals.orders_shipping.create({
                        order_id: order.id,
                        order_shipping_name: address.shipping_name,
                        order_shipping_address: address.shipping_address,
                        order_shipping_address1: address.shipping_address1,
                        order_shipping_address2: address.shipping_address2,
                        order_shipping_city:address.shipping_city,
                        order_shipping_state: address.shipping_state,
                        order_shipping_country: address.shipping_country,
                        order_shipping_zip:address.shipping_pincode,
                        order_shipping_phone: address.shipping_mobile,
                        order_shipping_email:address.shipping_email,
                });
              
          

                const services = async(obj) => { 
           // services = result.map(function(obj) {
                var color=obj.color_id;
                var size=obj.size_id;
          
            let sizename='NA';let colorname='NA';

            if(color!=0){       
          
              var colorname1=await modals.sequelize.query(
                `SELECT 
                       colors.name,
                       colors.color_code
                        FROM colors
                        WHERE 
                        colors.id=${color} `,
                {
                  type: QueryTypes.SELECT
                }
              );
            colorname=colorname1[0].name;
            
          }
          
            if(size!=0){
             var sizename1=await modals.sequelize.query(
                `SELECT 
                            sizes.name
                       FROM sizes
                    WHERE 
                    sizes.id=${size}
                    `,
                {
                  type: QueryTypes.SELECT
                }
              );
              sizename =sizename1[0].name;
            
          }
          let price=0;

          if(color!=0 && size==0){       
          var usedetai = await modals.product_attributes.findOne({
              attributes: ['price'],
              where: { product_id: obj.product_id, color_id: color }
          })
           price +=usedetai.price;
          
        }
        
          if(color==0 && size!=0){
          var usedetai = await modals.product_attributes.findOne({
              attributes: ['price'],
              where: { product_id: obj.product_id, size_id: size }

          })
           price +=usedetai.price;
          
        }
        if(color!=0 && size!=0){
          var usedetai = await modals.product_attributes.findOne({
              attributes: ['price'],
              where: { product_id: obj.product_id, size_id: size,color_id: color }
          })
       
          //console.log("dv",usedetai);
           price +=usedetai.price;
          
        }
                var data = {
                    "order_id": order.id,
                    "suborder_no": 'MLG_ORD_11',
                    "product_id": obj.product_id,
                    "product_name": obj.product_name,
                    "product_qty": obj.qty,
                    "product_price": obj.spcl_price + price,
                    "product_price_old": obj.price + price,
                    "qty": obj.qty,
                    "order_coupon_amount": perDis,
                    "order_shipping_charges": perSerChar,
                    "order_cod_charges": 0,
                    "size_id":obj.size_id,
                    "color_id":obj.color_id,
                    "size":sizename,
                    "color":colorname,
                };

               
                return data;
            };//);
            ///await modals.orderDetails.create(data);
            const result1 = await mapAsync(services, result);
           await modals.orderDetails.bulkCreate(result1);

           

            await modals.carts.destroy({ where: { user_id: req.body.userCokkie } });

            var data = {};
            data.status = 200;
            data.msg = 'Order placed successfully';
            data.data=order;
            respHelper.msg(res, data);
            return ;
        

    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);

    }
};