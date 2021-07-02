var jwt = require('jsonwebtoken');
var config = require('./database');

function authenticateUser(req, res, next) {
  var token = req.headers['x-access-token'];
  if (!token){
    return res.status(403).send({
        success: false,
        msg: 'Invalid authentication',
        data:null
    });
  }
    
    
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err)
    {
        return res.status(403).send({
            success: false,
            msg: 'Invalid authentication',
            data:null
        });
    } else{
                req.userId = decoded.id;
                next();
    }
   
    
  });
}

module.exports = authenticateUser;