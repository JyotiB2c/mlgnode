var jwt = require('jsonwebtoken');
var config = require('./database');
var respHelper = require('../common/response');
exports.userAuthorized = (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token) {
        var data = {};
        data.status = 401;
        respHelper.msg(res, data);
    }


    jwt.verify(token, config.secret, function(err, decoded) {
        console.log("====", err)

        if (err) {
            var data = {};
            data.status = 401;
            respHelper.msg(res, data);
        } else {
            req.body.userId = decoded.id;
            next();
        }


    });
}