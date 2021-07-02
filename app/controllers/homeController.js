'use strict';

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
  exports.searchProduct = async function(req, res) {
    try {
        var obj = req.body;
        var offset = 0;
        var limit = 8;
        if (obj.hasOwnProperty("page")) {
            offset = (req.body.page - 1) * limit;
        }
        var wherecondition = {
                status:1,
                isdeleted:0
        }
        if (req.body.search) {
            var obj2 = {
                name: {
                    [Op.like]: '' + req.body.search + '%'
                }
            }
            Object.assign(wherecondition, {}, obj2);
        }

        var user_order = await modals.cities.findAndCountAll({
            attributes: [
                'id', 'name'
                ],
                where: wherecondition,
                offset: offset,
                limit: limit
        });
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? " List found" : "no found";
        data.data = {
            "cities": user_order.rows,
        };
        respHelper.msg(res, data);
   } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
   }
};
exports.haveQuery=async function(req, res){
try{
    await modals.haveQuery.create({ user_id:req.body.user_id,customer_query: req.body.customer_query});
   
    var data = {};
    data.status = 200;
    data.msg = "Your query successfully submitted."
    data.data ={};
    respHelper.msg(res, data);
}
catch (ex) {
    var data = {};
    data.status = 500;
    respHelper.msg(res, data);
}
}
  exports.subscribe=async function(req,res){
            try {
               var subs = await modals.subscription.findOne({
                    attributes: ['id'],
                    where: { email: req.body.email }
                })
                if (subs) {
                     var data = {};
                    data.status = 204;
                    data.success =false;
                    data.msg =  "already subscribe.";
                    respHelper.msg(res, data); 
                }
                else {
                    await modals.subscription.create({ email: req.body.email });
                    commonHelper.sendSubscriptionMail({ email: req.body.email });
                    var data = {};
                    data.status = 200;
                    data.msg = "You have subscribed successfully."
                    data.data ={};
                    respHelper.msg(res, data);
                }

            }
        catch (ex) {
                var data = {};
                data.status = 500;
                respHelper.msg(res, data);
        }
  }
  exports.contactus=async function(req,res){
    try {
     
         
            commonHelper.sendContactusMail({ name: req.body.name,email: req.body.email,
                phone: req.body.phone,msg: req.body.message });
            var data = {};
            data.status = 200;
            data.msg = "Thank you for contact us. we will get back to you soon."
            data.data ={};
            respHelper.msg(res, data);
        

    }
catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
}
}

exports.pincode = async function(req, res) {
    try {
        var obj = req.body;
        var offset = 0;
        var limit = 8;
        if (obj.hasOwnProperty("page")) {
            offset = (req.body.page - 1) * limit;
        }
        var wherecondition = {
            city:req.body.city
        }
        if (req.body.search) {
            var obj2 = {
                pincode: {
                    [Op.like]: '' + req.body.search + '%'
                }
            }
            Object.assign(wherecondition, {}, obj2);
        }

        var user_order = await modals.pincodes.findAndCountAll({
            attributes: [
                 ['pincode','zip']
                ],
                where: wherecondition,
                offset: offset,
                limit: limit
        });
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "Delivery available in your location" : "Delivery not available for your location";
        data.data = {
            "total_page": Math.ceil(user_order.count / limit),
            "pincodes": user_order.rows,
        };
        respHelper.msg(res, data);
   } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
   }
};
  exports.cities = async function(req, res) {
    try {
        var obj = req.body;
        var offset = 0;
        var limit = 8;
        if (obj.hasOwnProperty("page")) {
            offset = (req.body.page - 1) * limit;
        }
        var wherecondition = {
                status:1,
                isdeleted:0
        }
        if (req.body.search) {
            var obj2 = {
                name: {
                    [Op.like]: '' + req.body.search + '%'
                }
            }
            Object.assign(wherecondition, {}, obj2);
        }

        var user_order = await modals.pincodes.findAndCountAll({
            attributes: [
                'id',
                ['city','name'],
                ['pincode','zip'],
                ],
                group: ['city'],
               // where: wherecondition
                //offset: offset,
                //limit: limit
        });
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "cities list found" : "no cities found";
        data.data = {
            "total_page": Math.ceil(user_order.count / limit),
            "cities": user_order.rows,
        };
        respHelper.msg(res, data);
   } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
   }
};
exports.HomeProducttab= async function(req, res){
try{
    var user_order = await modals.homeProductsection.findAndCountAll({
        attributes: [
            'name','id'
        ],
        where: {
            isdeleted:0
        }
    });
    var result = [];
    result = user_order.rows.map(function(obj) {
        let r = {
            "id": obj.id,
            "name": obj.name,
           
          
        };
        return r;
    });
    var data = {};
    data.status = 200;
    data.success = (user_order.count > 0) ? true : false;
    data.msg = (user_order.count > 0) ? "Data  found" : "no Data found";
    data.data = result;
    respHelper.msg(res, data);
    
}catch(ex){
    var data = {};
    data.status=500;
    respHelper.msg(res, data);
}
}
exports.advertisment = async function(req, res){
    try{
        var user_order = await modals.advertisment.findAndCountAll({
            attributes: [
                'advertise_position','id','image','url','short_text','description'
            ],
            order: [
                ['advertise_position', 'asc']
            ],
            where: {
                status:1
            }
        });
        var result = [];
        result = user_order.rows.map(function(obj) {
            let r = {
                "id": obj.id,
                "advertise_position": obj.advertise_position,
                "image": constant.imageURL+"/advertise/"+obj.image,
                "url": obj.url,
                "short_text": obj.short_text,
                "description": obj.description,
            };
            return r;
        });
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "Data  found" : "no Data found";
        data.data = result;
        respHelper.msg(res, data);
        
    }catch(ex){
        var data = {};
        data.status=500;
        respHelper.msg(res, data);
    }
}
exports.homeProducts = async function(req, res){
try{
    var obj = req.body;
    var offset = 0;
    var limit = 5;
    var city='NA';
        if (obj.hasOwnProperty("city")) {
            city =req.body.city;
        }
        
    var user_order = await modals.product_categories.findAndCountAll({
        where: {

            //    cat_id:req.body.category_id
        },
        group: ['product_id'],
        include:{
            model:modals.products,
            attributes: [
            'id', 'name', 'url','price','spcl_price','default_image','rating','review',
            'qty','product_base_type','product_type'
            ],
            where: {
            feature_type:req.body.feature_type,
            status:1,
            isdeleted:0
            },
            order: [
                ['id', 'DESC'],
               // ['name', 'ASC'],
            ],
            include:[{
                model:modals.vendors,
                required: true,
                attributes: ['id'] ,
                status:1,
                isdeleted:0,
                include:{
                    model:modals.vendor_company_info,
                    required: true
                },
                },
                {
                    model:modals.product_city,
                    required: true,
                    attributes: ['city'] ,
                    where: {
                        city:city
                    }
                }]
          
        },
        offset: offset,
        limit: limit,
    });
    var result = [];
    result = user_order.rows.map(function(obj) {
        let r = {
            "id": obj.product.id,
            "name": obj.product.name,"url": obj.product.url,
            "price": obj.product.price,
            "spcl_price": obj.product.spcl_price,
            "rating": obj.product.rating,
            "review": obj.product.review,
            "image": constant.imageURL+"/products/"+obj.product.default_image,
            "inMyWishlist":false,
            'product_type':obj.product.product_type,
            'product_base_type':obj.product.product_base_type,
            "qty":obj.product.qty
        };
        return r;
    });
    var data = {};
    data.status = 200;
    data.success = (user_order.count > 0) ? true : false;
    data.msg = (user_order.count > 0) ? "products list found" : "no products found";
    data.data = {
        //"total_page": Math.ceil(user_order.count / limit),
        "products": result,
    };
    respHelper.msg(res, data);
}
catch (ex) {
    var data = {};
    data.status = 500;
    respHelper.msg(res, data);
}
}
exports.ourTeam = async function (req, res){
    try{
    var obj = req.body;
    var user_order = await modals.teams.findAndCountAll({
        attributes: [
            'position','name','description',
            'image',
            'id'
        ],
        where: {
            
        },
        order: [
            ['id', 'DESC'],
           // ['name', 'ASC'],
        ],
    });
    var result = [];
    result = user_order.rows.map(function(obj) {
        let r = {
            "name":obj.name,
            "position":obj.position, "description":obj.description, 
            "image": constant.imageURL+"/team/"+obj.image,
            "id":obj.id
        };
        return r;
    });
    var data = {};
    data.status = 200;
    data.success = (user_order.count > 0) ? true : false;
    data.msg = (user_order.count > 0) ? "Data found" : "no Data found";
    data.data = result;
    respHelper.msg(res, data);
       }catch(ex){
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
       }
}
exports.faqs = async function(req, res){
   try{
var obj = req.body;
var user_order = await modals.faqs.findAndCountAll({
    attributes: [
        'fld_faq_question', 
        'fld_faq_answer',
        'id'
    ],
    where: {
        fld_faq_status:1
    },
    order: [
        ['id', 'DESC'],
       // ['name', 'ASC'],
    ],
});
var result = [];
result = user_order.rows.map(function(obj) {
    let r = {
        "fld_faq_question":obj.fld_faq_question,
        "fld_faq_answer":obj.fld_faq_answer,
        "id":obj.id
    };
    return r;
});
var data = {};
data.status = 200;
data.success = (user_order.count > 0) ? true : false;
data.msg = (user_order.count > 0) ? "Data found" : "no Data found";
data.data = result;
respHelper.msg(res, data);
   }catch(ex){
    var data = {};
    data.status = 500;
    respHelper.msg(res, data);
   }
}
  exports.slider = async function(req, res) {
    try {
        var obj = req.body;
        var city='';
        if (obj.hasOwnProperty("city")) {
            city =req.body.city;
        }
        var user_order = await modals.sliders.findAndCountAll({
            attributes: [
                'image', 
                'short_text',
                'url'
            ],
            where: {
                status:1,
                [Op.not]: [{city_ids:city}],
            }
        });
        var result = [];
        result = user_order.rows.map(function(obj) {
            let r = {
                "short_text": obj.short_text,
                "image": constant.imageURL+"/slider/"+obj.image,
                "url": obj.url
              
            };
            return r;
        });
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "Sliders  found" : "no slider found";
        data.data = result;
        respHelper.msg(res, data);
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
};
exports.homeCategory = async function(req, res) {
   try {
        var obj = req.body;
       
        var user_order = await modals.categories.findAndCountAll({
            attributes: [
                'logo', 'id',
                'name',
                'parent_id',
                'cat_url'
            ],
            where: {
                status:1,parent_id:1, isdeleted:0
            }
        });
        var result = [];
        result = user_order.rows.map(function(obj) {
           
            let r = {
                "id": obj.id,
                "name": obj.name,
                "image": constant.imageURL+"/category/logo/"+obj.logo,
                "cat_url": obj.cat_url
              
            };
        
            return r;
        });
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "Data found" : "no data found";
        data.data = result;
        respHelper.msg(res, data);
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
    }
};
exports.page_details = async function (req,res) {
    try {
        
        var get_url = await modals.pages.findOne({
            attributes: ['id', 'title', 'url_name', 'banner',
            [modals.sequelize.literal("concat('" + constant.imageURL + "/pages/', banner)"), 'image'],
            'description','description1','description2','description3'],
            where: { url_name: req.body.page_url }
        })
        if (get_url) {

            commonHelper.sendContactusMail({
                name: "yogendra",
                email: "yogendraverma325@gmail.com",
                phone: "7017734526",
                msg: "hi this is the new one"
         });
         
            var data = {};
            data.status = 200;
            data.success =true;
            data.msg = "Page found";
            //data.data = get_url.title;
            data.data = get_url;
            respHelper.msg(res, data); 
        }
        else {
            var data = {};
            data.status = 400;
            data.success =true;
            data.msg =  "no page found";
            data.data = '';
            respHelper.msg(res, data); 
        }
    } catch (ex) {
        var data = {};
        data.status = 500;
        data.success =true;
        respHelper.msg(res, data); 
    }
}

exports.siteData = async function (req,res) {
    try {
      
        var store_info = await modals.store_info.findOne({
             attributes: [
            'name',
            'email',
            'phone',
            'phone_2',
            'phone_3',
            'address',
            'branch',
            'facebook_url',
            'twiter_url',
            'cart_total',
            'shipping_charge',
            ['linkedin_url','google_url'],
            ['snapchat_url','insta_url'],
            'monday_friday_from',
            'monday_friday_to',
            'saturday_from',
            'saturday_to',
            'home_meta_title',
            'home_meta_keyword',
            'home_meta_title',
           
            'contact_meta_title',
            'contact_meta_keyword',
            'contact_meta_title'
            
        ],
            where: { id: 1 }
        })
        if (store_info) {

            var data = {};
            data.status = 200;
            data.success =true;
            data.msg =  "site data  found";
            data.data = store_info;
            respHelper.msg(res, data); 
        }
        else {
            var data = {};
            data.status = 200;
            data.success =true;
            data.msg =  "";
            data.data = '';
            respHelper.msg(res, data); 
        }
    } catch (ex) {
        var data = {};
        data.status = 500;
        data.success =true;
        respHelper.msg(res, data); 
    }
}



