'user strict';
var sql = require('./db.js');
const md5 = require("blueimp-md5")
var User = function(user) {
    this.email = user.email;
    this.password = user.password;
};
User.registerM = async function(user_data, result) {

    let stmt = `INSERT INTO users(
                            name,
                            email,
                            password,
                            user_type
                 )
            VALUES(?,?,?,?)`;
    let todo = [user_data.name, user_data.email, md5(user_data.password), user_data.user_type];

    var query =sql.query(stmt, todo, (err, results) => {
        if (err) {
            result(err, null);
        } else {
            result(null, results.insertId);
        }
    });
	
};


User.resetPasswordM = function(user_data, result) {
    sql.query("UPDATE users SET password = ? WHERE id = ?", [md5(user_data.password), user_data.user_id], function(err, res) {
        if (err) {
            result(err, null);
        } else {
            result(null, res);
        }
    });
};
User.resendOtpmailM = function(user_data, result) {
    sql.query("UPDATE users SET email_otp = ? WHERE id = ?", [user_data.otp, user_data.user_id], function(err, res) {
        if (err) {
            result(err, null);
        } else {
            result(null, res);
        }
    });
};
User.verifyEmailM = function(user_data, result) {
    sql.query("UPDATE users SET email_verified = 1 WHERE id = ?  ", [user_data.user_id], function(err, res) {
        if (err) {
            result(err, null);
        } else {
            result(null, res);
        }
    });
};
User.checkOtpM = function(user_data, result) {
    sql.query("Select * from users where email_otp = ? and id = ? limit 1 ", [user_data.otp, user_data.user_id], function(err, res) {
        if (err) {
            result(err, null);
        } else {
            result(null, res);
        }
    });
};

User.forgotPasswordM = async function(user_data, result) {
    sql.query("Select id,email from users where email = ?  limit 1 ", [user_data.email], function(err, res) {
        if (err) {
            result(err, null);
        } else {
            result(null, res);
        }
    });
};
module.exports = User;