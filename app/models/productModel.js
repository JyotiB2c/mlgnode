'user strict';
var sql = require('./db.js');

//Task object constructor
var Product = function(product){

};

Product.getProductDetails = function (productId, result) {
        sql.query("CALL get_product_details(?)", productId, function (err, res) {             
                if(err) {
                    result(err, null);
                }
                else{
                    result(null, res[0][0]);
              
                }
            });   
};

module.exports= Product;