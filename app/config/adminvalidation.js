const adminsSchema = require('../models/admins');
const bcrypt = require('bcryptjs');
exports.userEmailexistSign =  (req, res, next) => {
    adminsSchema.findOne(
        {email:req.body.email},
        {_id:1,email:1,name:1,password:1,role:1}
        ).then(result => {
            if(result){
                    req.body.user = result;
                    next();
            } else{

             
                    return res.status(200).send({
                        success: false,
                        msg: 'Account not Exist',
                        data:null
                    });
              
                
            }
    }).catch(err => {
        return res.status(200).send({
            success: false,
            msg: 'Something went wrong',
            data:err
        });
    }
    );
}