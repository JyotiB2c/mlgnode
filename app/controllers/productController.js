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
exports.occassions=async function(req, res){
    try{

        var products= await modals.filters.findAll({
            attributes: [
                'name',
                'url'
                ],
                where: {
                    status:1,
                    isdeleted:0
                    
                    },
                include:{
                    model:modals.filter_values,
                    attributes: [
                        'filter_value','filter_value_url'
                    ]
                },
            offset: 0,
            limit: 10,
        });

        var data = {};
        data.status = 200;
        data.msg = "Occaasion found"
        data.data =products;
        respHelper.msg(res, data);

    }
    catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
   }
}

  exports.rating_submit =async function(req, res){
    try {
        var subs = await modals.Rating.findOne({
             attributes: ['id'],
             where: { product_id: req.body.product_id,user_id: req.body.user_id }
         })
         if (subs) {

              var data = {};
             data.status = 204;
             data.success =false;
             data.msg =  "You have already give the rating this product.";
             respHelper.msg(res, data); 
         }
         else {
            var usedetai = await modals.customers.findOne({
                attributes: ['name'],
                where: { id: req.body.user_id }
            })
             await modals.Rating.create({ product_id: req.body.product_id,user_id: req.body.user_id
            ,rating: req.body.rating,review: req.body.review,user_name:usedetai.name });
             var data = {};
             data.status = 200;
             data.msg = "Thanks for give the rating."
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
  exports.search=async function(req, res) {
    try{
        var obj = req.body;
        var city='NA';
        if (obj.hasOwnProperty("city")) {
            city =req.body.city;
        }
      var products= await modals.products.findAll({
          attributes: [
              'id',
              'name',
              'url',
              [modals.sequelize.literal('(SELECT 0)'), 'cat']
              ],
              where: {
                  [Op.or]: [
                       {  
                      name: {
                          [Op.like]: `%${req.body.search}%`
                           } 
                       },
                      {  
                          meta_title: {
                      [Op.like]: `%${req.body.search}%`
                      } 
                      }
                  ]
                  },
          offset: 0,
          limit: 4,
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
          
      });

      var categories= await modals.categories.findAll({
          attributes: [
                  'id',
                  'name',
                  ['cat_url','url'],
                  [modals.sequelize.literal('(SELECT 1)'), 'cat']
              ],
              where: {
                  [Op.or]: [
                       {  
                          description: {
                          [Op.like]: `%${req.body.search}%`
                           } 
                       }
                  ]
                  },
          offset: 0,
          limit: 4,
      });

      var children = products.concat(categories);
          var data = {};
          data.status = 200;
          data.msg = "Search returned";
          data.data =children
          respHelper.msg(res, data);

     } catch (ex) {
      var data = {};
      data.status = 500;
      respHelper.msg(res, data);
 }
}
exports.similarProduct =async function(req, res) {
    try {
        var obj = req.body;
        var offset = 0;
        var limit = 8;
        var city='NA';
        if (obj.hasOwnProperty("city")) {
            city =req.body.city;
        }
        if (obj.hasOwnProperty("page")) {
            offset = (req.body.page - 1) * limit;
        }
        var user_id=0;
        var catlist = await modals.product_categories.findAll({
            attributes: ['cat_id'],
            where: { product_id: req.body.prd_id }
        });
        const getProd1 = async(obj1) => { 
            return obj1.cat_id
         
           // return r;
        }
        const result1 = await mapAsync(getProd1, catlist);
      

        var user_order = await modals.product_categories.findAndCountAll({
            where: {
                cat_id: {
                    [Sequelize.Op.in]: result1,
                  },
                
            },
            group: ['product_id'],
            include:{
                model:modals.products,
                attributes: [
                'id', 'name','url', 'price','spcl_price','default_image','rating','review',
                'qty','product_base_type','product_type','meta_title','meta_keyword','meta_description'
                ],
                where: {
                    [Op.not]: [{id: req.body.prd_id}],      
                status:1,
                isdeleted:0
                },
                include:{
                        model:modals.product_city,
                        required: true,
                        attributes: ['city'] ,
                        where: {
                            city:city
                        }
                    },
            },
         	order: [
           
            [modals.products, 'id','desc']
            ],
            offset: offset,
            limit: limit
        });
       
         const getProd = async(obj) => { 

            const wishlist =await modals.sequelize.query(
                `SELECT count(id) as count FROM tbl_wishlist WHERE fld_user_id=:fld_user_id AND fld_product_id=:fld_product_id `,
                {
                  replacements: { fld_product_id: obj.product.id ,fld_user_id:user_id},
                  type: QueryTypes.SELECT
                }
              );

              const ratingReview =await modals.sequelize.query(
                `SELECT count(id) as count FROM product_rating WHERE product_id=:fld_product_id `,
                {
                  replacements: { fld_product_id: obj.product.id},
                  type: QueryTypes.SELECT
                }
              );
              var wishlist1=false;
                if(wishlist[0].count>0){
                    wishlist1=true;
                }
                var haveCrossProduct=false;

                const haveCrossProductCount =await modals.sequelize.query(
                    `SELECT count(id) as count FROM products_relation WHERE  product_id=:fld_product_id `,
                    {
                      replacements: { fld_product_id:  obj.product.id },
                      type: QueryTypes.SELECT
                    }
                  );
                  if(haveCrossProductCount[0].count>0){
                    haveCrossProduct=true;
                }
            let r = {
                "id": obj.product.id,
                "name": obj.product.name, "url": obj.product.url,
                "price": obj.product.price,
                "spcl_price": obj.product.spcl_price,
                "image": constant.imageURL+"/products/"+obj.product.default_image,
                'product_type':obj.product.product_type,
                'product_base_type':obj.product.product_base_type,
                "qty":obj.product.qty,
                "rating": ratingReview[0].count,
                "review": ratingReview[0].count,
                "inMyWishlist":wishlist1,
                "haveCrossProduct":haveCrossProduct,
            };
         
            return r;
        }
        const result = await mapAsync(getProd, user_order.rows)
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "List found" : "no product found";
        data.data = {
            "total_page": Math.ceil(user_order.count / limit),
            "products": result,
        };
        respHelper.msg(res, data);
   } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
   }
}
  exports.wishlistActions = async function(req, res) {
    try {
        const { error, value } = common.wishlist.validate(req.body);
        var user_id=req.body.user_id;
        if (error) {
            var data = {};
            data.status = 400;
            respHelper.msg(res, data);
        } else {

            if (req.body.action_type == 0) {
                let serviceExist = await modals.products.findOne({ attributes: ['id'], where: { id: req.body.prd_id } });
                if (serviceExist) {

                  
                    switch (req.body.action_type) {
                        case 0:
                            let user_role = await modals.tbl_wishlist.findOne({ attributes: ['id'], where: { fld_user_id: user_id, fld_product_id: req.body.prd_id } });
                            if (user_role) {
                                var data = {};
                                data.status = 204;
                                data.msg = 'Product already in your wishlist';
                                data.data = {};
                                respHelper.msg(res, data);
                            } else {
                                await modals.tbl_wishlist.create({ fld_user_id: user_id, fld_product_id: req.body.prd_id });
                                var data = {};
                                data.status = 200;
                                data.msg = 'Product added to wishlist';
                                data.data = {};
                                respHelper.msg(res, data);
                            }

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
                await modals.tbl_wishlist.destroy({ where: { fld_user_id: user_id, fld_product_id: req.body.prd_id } });
                var data = {};
                data.status = 200;
                data.msg = 'Product removed from your wishlist';
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

  exports.wishlist = async function(req, res) {
    try {
        var obj = req.body;
        var offset = 0;
        var limit = 8;
        if (obj.hasOwnProperty("page")) {
            offset = (req.body.page - 1) * limit;
        }
        var user_order = await modals.tbl_wishlist.findAndCountAll({
            where: {
                fld_user_id:req.body.user_id
            },
            include:{
                model:modals.products,
                attributes: [
                'id', 'url','name', 'price','spcl_price','default_image','rating','review','qty','product_base_type','product_type'
                ],
                where: {
                   
                status:1,
                isdeleted:0
                },
            },
           
            offset: offset,
            limit: limit,
        });
        var result = [];
        result = user_order.rows.map(function(obj) {
            let r = {
                "id": obj.product.id,
                "name": obj.product.name,
                "url": obj.product.url,
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
        data.msg = (user_order.count > 0) ? "wishlist list found" : "no wishlist product found";
        data.data = {
            "total_page": Math.ceil(user_order.count / limit),
            "products": result,
        };
        respHelper.msg(res, data);
   } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
   }
};
exports.cross_products= async function(req, res) {
    try{
    var obj = req.body;
    var offset = 0;
    var limit = 20;
    var spclPriceOrder='ASC';
    var IdOrder='DESC';
    var user_id=0;
    var city='NA';
    if (obj.hasOwnProperty("city")) {
        city =req.body.city;
    }
    var user_order = await modals.products_relation.findAndCountAll({
            attributes: [
            'price'
            ],
                where: {
                    product_id:req.body.product_id
                },
            include:{
                model:modals.products,
                required: true,
                attributes: [
                'id', 'name','url', 'price','spcl_price','default_image','rating','review','qty','product_base_type','product_type'
                ],
                    order: [
                    [modals.products, 'spcl_price',spclPriceOrder],
                    [modals.products, 'id',IdOrder]
                    ],
                where: {
                status:1,
                isdeleted:0
                },
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

        const getProd = async(obj) => { 

            const wishlist =await modals.sequelize.query(
                `SELECT count(id) as count FROM tbl_wishlist WHERE fld_user_id=:fld_user_id AND fld_product_id=:fld_product_id `,
                {
                  replacements: { fld_product_id: obj.product.id ,fld_user_id:user_id},
                  type: QueryTypes.SELECT
                }
              );

              const ratingReview =await modals.sequelize.query(
                `SELECT count(id) as count FROM product_rating WHERE product_id=:fld_product_id `,
                {
                  replacements: { fld_product_id: obj.product.id},
                  type: QueryTypes.SELECT
                }
              );
              var wishlist1=false;
                if(wishlist[0].count>0){
                    wishlist1=true;
                }
            let r = {
                "id": obj.product.id,
                "name": obj.product.name,
                "url": obj.product.url,
                "cross_price": obj.price,
                "price": obj.product.price,
                "spcl_price": obj.price,
                "rating": ratingReview[0].count,
                "review": ratingReview[0].count,
                "image": constant.imageURL+"/products/"+obj.product.default_image,
                "inMyWishlist":wishlist1,
                'product_type':obj.product.product_type,
                'product_base_type':obj.product.product_base_type,
                "qty":obj.product.qty
            };
            return r; 
        
        }

        // Write async code like you write synchronous code
        const result = await mapAsync(getProd, user_order.rows)
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "Products list found" : "no products found";
        data.data = {
            "total_page": Math.ceil(user_order.count / limit),
            "products": result,
        };
        respHelper.msg(res, data);
    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
   }

}
exports.productList = async function(req, res) {
    try {
        var obj = req.body;
        var offset = 0;
        var limit = 8;
        var spclPriceOrder='ASC';
        var IdOrder='DESC';
        var user_id=0;
        var city='NA';
        if (obj.hasOwnProperty("city")) {
            city =req.body.city;
        }

        if (obj.hasOwnProperty("page")) {
            offset = (req.body.page - 1) * limit;
        }
        if (obj.hasOwnProperty("user_id")) {
            user_id =req.body.user_id;
        }
       
        if (obj.hasOwnProperty("price_sort_by")) {
            if(req.body.price_sort_by=='high_to_low'){
                spclPriceOrder='DESC'
            }
           
        }
        if (obj.hasOwnProperty("sort_by")) {
            if(req.body.sort_by=='old'){
                IdOrder='ASC'
            }
        }
       
       // console.log(spclPriceOrder);
        var user_order = await modals.product_categories.findAndCountAll({
            where: {
                   cat_id:req.body.category_id
            },
            include:{
                model:modals.products,
                attributes: [
                'id', 'name','url', 'price','spcl_price','default_image','rating','review',
                'qty','product_base_type','product_type','meta_title','meta_keyword','meta_description'
                ],
                where: {
                status:1,
                isdeleted:0
                },
                include:{
                        model:modals.product_city,
                        required: true,
                        attributes: ['city'] ,
                        where: {
                            city:city
                        }
                    },
            },
         	order: [
             [modals.products, 'spcl_price',spclPriceOrder],
            [modals.products, 'id',IdOrder]
            ],
            offset: offset,
            limit: limit
        });


        const getProd = async(obj) => { 

            const wishlist =await modals.sequelize.query(
                `SELECT count(id) as count FROM tbl_wishlist WHERE fld_user_id=:fld_user_id AND fld_product_id=:fld_product_id `,
                {
                  replacements: { fld_product_id: obj.product.id ,fld_user_id:user_id},
                  type: QueryTypes.SELECT
                }
              );

              const ratingReview =await modals.sequelize.query(
                `SELECT count(id) as count FROM product_rating WHERE product_id=:fld_product_id `,
                {
                  replacements: { fld_product_id: obj.product.id},
                  type: QueryTypes.SELECT
                }
              );
              var wishlist1=false;
                if(wishlist[0].count>0){
                    wishlist1=true;
                }
                var haveCrossProduct=false;

                const haveCrossProductCount =await modals.sequelize.query(
                    `SELECT count(id) as count FROM products_relation WHERE  product_id=:fld_product_id `,
                    {
                      replacements: { fld_product_id:  obj.product.id },
                      type: QueryTypes.SELECT
                    }
                  );
                  if(haveCrossProductCount[0].count>0){
                    haveCrossProduct=true;
                }

            let r = {
                "id": obj.product.id,
                "name": obj.product.name,
                "url": obj.product.url,
                "price": obj.product.price,
                "spcl_price": obj.product.spcl_price,
                "rating": ratingReview[0].count,
                "review": ratingReview[0].count,
                "image": constant.imageURL+"/products/"+obj.product.default_image,
                "inMyWishlist":wishlist1,
                "haveCrossProduct":haveCrossProduct,
                'product_type':obj.product.product_type,
                'product_base_type':obj.product.product_base_type,
                'meta_title':obj.product.meta_title,
                'meta_keyword':obj.product.meta_keyword,
                "meta_description":obj.product.meta_description,
                "qty":obj.product.qty
               
            };
            return r; 
        }

        // Write async code like you write synchronous code
        const result = await mapAsync(getProd, user_order.rows)
        var data = {};
        data.status = 200;
        data.success = (user_order.count > 0) ? true : false;
        data.msg = (user_order.count > 0) ? "Products list found" : "No products found";
        data.data = {
            "total_page": Math.ceil(user_order.count / limit),
            "products": result
           
          
        };
        respHelper.msg(res, data);
   } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
   }
};
exports.colorImage = async function(req, res) {
    try {

        var defaultColor=req.body.color_id;
        
        var prdimages=await modals.sequelize.query(
            `SELECT 
                CONCAT("${constant.imageURL}/products/",  product_configuration_images.product_config_image) AS image
                   FROM product_configuration_images
                WHERE 
                product_configuration_images.color_id=${defaultColor} AND
                product_configuration_images.product_id=:fld_product_id `,
            {
              replacements: { fld_product_id:  req.body.product_id },
              type: QueryTypes.SELECT
            }
          );

          var data = {};
          data.status = 200;
          data.success = true;
          data.msg = "Color images founds"
          data.data =prdimages
          respHelper.msg(res, data);

    } catch (ex) {
        var data = {};
        data.status = 500;
        respHelper.msg(res, data);
   }
}
exports.productDetails = async function(req, res) {
    //try {
        var obj = req.body;
        var offset = 0;
        var limit = 10;
        if (obj.hasOwnProperty("page")) {
            offset = (req.body.page - 1) * limit;
        }
        var city='NA';
        if (obj.hasOwnProperty("city")) {
            city =req.body.city;
        }
        var user_id=0;
        if (obj.hasOwnProperty("user_id")) {
            user_id = req.body.user_id;
        }
        var product = await modals.products.findOne({
            attributes: [
                'id', 'name','url', 'price','spcl_price','default_image','rating','review','qty',
                'short_description','long_description','shipping_charges','product_type','product_base_type',
                'meta_title','meta_keyword','meta_description'
            ],
            where: {
                id:req.body.product_id,
                status:1,
                isdeleted:0
            },
            offset: offset,
            limit: limit,
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
        });

        if(!product){
            var data = {};
            data.status = 204;
            data.msg = "Products not found"
            respHelper.msg(res, data);
            return ;
        }

       var Specifications = await modals.Specifications.findAll({
            attributes: [
                'product_general_descrip_title','product_general_descrip_content'
            ],
            where: {
                product_id:req.body.product_id
            }
        });

        var ratinglist = await modals.Rating.findAll({
            attributes: ['id', 'user_name', 'rating', 'review',
            'review_date'],
            where: { 
              //  isActive:1,
                product_id: req.body.product_id
            }
        })

        var haveCrossProduct=false;

        const haveCrossProductCount =await modals.sequelize.query(
            `SELECT count(id) as count FROM products_relation WHERE  product_id=:fld_product_id `,
            {
              replacements: { fld_product_id:  product.id },
              type: QueryTypes.SELECT
            }
          );

          if(haveCrossProductCount[0].count>0){
            haveCrossProduct=true;
        }
                
          var colorAtrbiutes =await modals.sequelize.query(
            `SELECT 
            product_attributes.size_id,
                product_attributes.color_id,
                product_attributes.product_id,
                product_attributes.price,
                colors.name as  color_name,
                CONCAT("${constant.imageURL}/products/",  product_configuration_images.product_config_image) AS image
              FROM product_attributes 
              JOIN colors ON colors.id=product_attributes.color_id
              JOIN product_configuration_images ON product_configuration_images.product_id=product_attributes.product_id
             WHERE 
              product_attributes.color_id!=0  AND 
              product_attributes.product_id=:fld_product_id 
              GROUP BY  product_attributes.color_id
              `,
            {
              replacements: { fld_product_id:  product.id },
              type: QueryTypes.SELECT
            }
          );

          var sizeAtrbiutes =await modals.sequelize.query(
            `SELECT 
                product_attributes.size_id,
                product_attributes.product_id,
                product_attributes.price,
                sizes.name as  size_name,
                CONCAT("${constant.imageURL}/products/",  product_configuration_images.product_config_image) AS image
              FROM product_attributes 
              JOIN sizes ON sizes.id=product_attributes.size_id
              JOIN product_configuration_images ON product_configuration_images.product_id=product_attributes.product_id
             WHERE 
              product_attributes.size_id!=0  AND 
              product_attributes.product_id=:fld_product_id 
              GROUP BY  product_attributes.size_id
              `,
            {
              replacements: { fld_product_id:  product.id },
              type: QueryTypes.SELECT
            }
          );

          var prdimages=[];
                if(product.product_type==1){
                    prdimages=await modals.sequelize.query(
                        `SELECT 
                            CONCAT("${constant.imageURL}/products/",  product_images.image) AS image
                               FROM product_images
                            WHERE 
                            product_images.product_id=:fld_product_id `,
                        {
                          replacements: { fld_product_id:  product.id },
                          type: QueryTypes.SELECT
                        }
                      );
                }else{
                    var defaultColor=0;
                    if(colorAtrbiutes.length>0){
                    defaultColor=colorAtrbiutes[0].color_id;
                    }
                    prdimages=await modals.sequelize.query(
                        `SELECT 
                            CONCAT("${constant.imageURL}/products/",  product_configuration_images.product_config_image) AS image
                               FROM product_configuration_images
                            WHERE 
                            product_configuration_images.color_id=${defaultColor} AND
                            product_configuration_images.product_id=:fld_product_id `,
                        {
                          replacements: { fld_product_id:  product.id },
                          type: QueryTypes.SELECT
                        }
                      );

                }

         
                var wishlist1=false;

                const wishlist =await modals.sequelize.query(
                    `SELECT count(id) as count FROM tbl_wishlist WHERE fld_user_id=:fld_user_id AND fld_product_id=:fld_product_id `,
                    {
                      replacements: { fld_product_id:  product.id ,fld_user_id:user_id},
                      type: QueryTypes.SELECT
                    }
                  );
                  
                if(wishlist.count>0){
                    wishlist1=true;
                }

                var productDelivered =await modals.sequelize.query(
                    `SELECT 
                         count(order_details.id) as count
                      FROM order_details 
                      JOIN orders ON order_details.order_id=orders.id
                     WHERE 
                        orders.customer_id=:fld_user_id  AND 
                        order_details.product_id=:fld_product_id AND
                        order_details.order_status=3
                      `,
                    {
                      replacements: { fld_product_id:  product.id,fld_user_id :user_id},
                      type: QueryTypes.SELECT
                    }
                  );
				
                  
                  var long_description =''; var short_description='';
                  if(product.long_description){
                    var long_description = product.long_description.replace(/<[^>]+>/g, '');
                  }
                  if(product.short_description){
                    var short_description = product.short_description.replace(/<[^>]+>/g, '');
                  }

        var result =  {
                "id": product.id,"url": product.url,
                "name": product.name,
                "price": product.price,
                "haveCrossProduct":haveCrossProduct,
                "spcl_price": product.spcl_price,
                "rating": product.rating,
                "ratingCount": 0,
                "isDelivered":(productDelivered[0].count>0)?true:false,
                "review": product.review,
                "image": constant.imageURL+"/products/"+product.default_image,
                "inMyWishlist":wishlist1,
                "qty":product.qty,
                "shipping_charges":product.shipping_charges,
                "short_description":(short_description)?short_description:'',
                "long_description":(long_description)?long_description:'',
                'product_type':product.product_type,
                'product_base_type':product.product_base_type,
                'meta_title':product.meta_title,
                'meta_keyword':product.meta_keyword,
                "meta_description":product.meta_description,
                "specifications":Specifications,
                "ratinglist":ratinglist,
                "images":prdimages,
                "attributes":sizeAtrbiutes,
                "attributes_color":colorAtrbiutes
        };
        var data = {};
        data.status = 200;
        data.success = true;
        data.msg = "Products details found"
        data.data =result
        respHelper.msg(res, data);
    // } catch (ex) {
    //     var data = {};
    //     data.status = 500;
    //     respHelper.msg(res, data);
    // }
};
