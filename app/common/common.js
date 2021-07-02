var nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');
var config = require('../config/database');
var constantKey = require('../config/constant')
var request = require("request");
var FCM = require('fcm-node')
var modals = require('../models/mainModal');
var serverKey = "AAAA44K6xAg:APA91bH6CSWRAMyBqyo5r0-L3PDSXaXWOUn9aEZ0kjffONcMZXBvNjuQDNHKujwT5_ZFISE_R_DETZ-tUlpDpHm8n8aOIORtZ46APFHi4toW1qjTR8szYR4h6SgrJOlqV-w6rn9wNWi8"
var img_src='http://jiocoins.co.in/mlgadmin/uploads';
/*var constantAPIKey ='260AF430D55EA9';
var Entity ='1501421690000011947';
var Tempid ='1507161786428947280';
var _senderid ='BCMAKT'; */

//var serverKey = "AAAAP7xQ2oc:APA91bH2ZKVbsYYaU1rI2rtT2hNQEtL_qrnFD02XVO6Cux3WCBQstJKFmAK9SlN3SFvcduD1VBpl6u3V1S8Hw5PC9iuPn57sjuxa9wSAnQIx8p8_bUhnXcxvKcJ7uzR6plR79duzXT-Q"
var fcm = new FCM(serverKey)
var _this = this;
const multer = require('multer');
exports.calculatePercentage = (cpnData,reqBody) => {
    var  calculatedDiscount=(reqBody.orderTotal/100)*cpnData.discount_value;
    if(cpnData.max_discount <calculatedDiscount ){
        calculatedDiscount=cpnData.max_discount;
    }
      return {
          discount:calculatedDiscount
      };
}
exports.checkCouponDate = (cpnData) => {
    var todayDate = new Date().toISOString().slice(0, 10);
    var resultData=todayDate >= cpnData.started_date && todayDate <= cpnData.end_date;
      return {
          error:resultData
      };
}

exports.checkCartValue = (cpnData,ordervalue) => {
      var resultData=ordervalue >= cpnData.below_cart_amt && ordervalue <= cpnData.above_cart_amt;
      return {
          error:resultData
      };
}

exports.usesperUser = async (coupon_code,userId) => {
       let usesCount = await modals.orders.count({ where: { customer_id: userId, coupon_code:coupon_code} });
      return {
          count:usesCount
      };
}
exports.checkCustomertype = async (userId) => {
    let usesCount = await modals.orders.count({ where: { customer_id: userId} });
   return {
       count:usesCount
   };
}

exports.sendRegMail = (data) => {
    let html = 'Hello ,' + data.otp + ' Welcome to the MLC'
    var mailOptions = {
        to: data.email,
        subject: 'Welcome',
        html: html
    };
    sendMailNew(mailOptions);
}
exports.sendOtpMail = (data) => {
    let html = '(' + data.otp + ') use this to verify your email'

    var mailOptions = {
        to: data.email,
        subject: 'OTP',
        html: html
    };
    sendMailNew(mailOptions);
}
exports.sendContactusMail = (data) => {
 
    let html = 'Name'+ data.name;
     html+= 'Email'+ data.email;
     html+= 'Phone'+ data.phone;
     html+= 'Comment'+ data.msg;
  

    var mailOptions = {
        to: data.email,
        subject: 'Contact Us',
        html: html
    };
    sendMailNew(mailOptions);
}

const sendMailNew = (mailData) => {
    let html = `<html lang="en">
    <head>        
      <!-- Theme Made By www.w3schools.com - No Copyright -->
      <title>Bootstrap Theme The Band</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
    </head>
    <body>
    
    <div class="container">
    ${mailData.html}
    </div>
    
    </body>
    </html>`;
    try {
        let transporter = nodemailer.createTransport({
            host: 'server.speed-trolley.com',
            // // port: 465,
            // port: 587,
            // secure: false, 
            auth: {
                user: 'yogendra@jiocoins.co.in',
                pass: 'yogi@12!@34#$'
            }
        });
        var mailOptions = {
            from: 'info@jiocoins.co.in',
            to: mailData.to,
            subject: mailData.subject,
            text: mailData.html
        };
        transporter.sendMail(mailOptions, function (error, info) {
            console.log("error",error);
            console.log("infor",info);
         });
    } catch (ex) {
        console.log("ex",ex);
     }

  };

exports.sendSubscriptionMail = (data) => {
    let html = 'You have subscribe successfully';

    var mailOptions = {
        to: data.email,
        subject: 'SUBSCRIBED',
        html: html
    };
    sendMailNew(mailOptions);
}



exports.single_notification = function (device_token, title, body, image) {
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: device_token,
        notification: {
            title: title,//'Title of your push notification',
            body: body,//'This is for multiple notification check',
            image:image,
            sound: "default"
        },
        data: {  //you can send only notification or only data(or include both)
            my_key: 'my value',
            my_another_key: 'my another value'
        },
        // content_available: true  
    };
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!", err);
        } else {
            console.log("Successfully sent with response: ", response);
        }
        // callback(err, 'Success');
    });
}

exports.multiple_notification = function (device_token, title, body, image) {
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        registration_ids: device_token,
        notification: {
            title: title,//'Title of your push notification',
            body: body,//'This is for multiple notification check',
            image:image,
            sound: "default"
        },
        data: {  //you can send only notification or only data(or include both)
            my_key: 'my value',
            my_another_key: 'my another value'
        },
        // content_available: true
    };
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!", err);
        } else {
            console.log("Successfully sent with response: ", response);
        }
        // callback(err, 'Success');
    });
}

exports.otpMsg = (data) => {
    console.log("ooooooooo",data)
    var html = '(' + data.otp + ') use this to verify '
    var smsOptions = {
        to: data.mobileNumber,
        html: html
    };
    _this.sendOtpSMS(smsOptions);
}
exports.welcomeMsg = (data) => {
    console.log("============>",)
    var html = "Hello "+ data.name + " welcome to MLC";
    var smsOptions = {
        to: data.mobileNumber,
        html: html
    };
    _this.sendOtpSMS(smsOptions);
}

exports.sendOtpSMS = (data) => {  
     var options = {
        method: 'POST',
        url: `http://sms.b2chosting.in/app/smsapi/index.php?key=${constantKey.api_key}&routeid=468&type=text&contacts=${data.to}&msg=${data.html}&senderid=${constantKey.senderid}`
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
    });
}

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        if (file.fieldname === "image") {
            callback(null, 'app/uploads/user_image');
        }
        else if (file.fieldname === "file")
            callback(null, 'app/uploads/business_pdf');
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
const fileFilter = (file, cb) => {
    if (file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype == 'image/png' || file.mimetype == 'image/png' || 'pdf') {
        return cb(null, true);
    } else {
        return cb(null, false);
    }
};

exports.uploadSingle = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {

        fileFilter(file, cb);
    }
}).fields([{ name: 'image' }, { name: 'file' }]);




exports.sendRegMail = (data) => {
    let html = 'Hello ,' + data.name + ' Welcome to the MLC';
    var mailOptions = {
        to: data.to,
        subject: 'Welcome',
        html: html
    };
    _this.sendMail(mailOptions);
}
exports.sendOtpMail = (data, otp) => {
    let html = '(' + otp + ') use this to verify'

    var mailOptions = {
        to: data.to,
        subject: 'OTP',
        html: html
    };
    _this.sendMail(mailOptions);
}
exports.sendMail = (mailData) => {
    let html = `<html lang="en">
    <head>        
      <!-- Theme Made By www.w3schools.com - No Copyright -->
      <title>Bootstrap Theme The Band</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
    </head>
    <body>
    
    <div class="container">
    ${mailData.html}
    </div>
    
    </body>
    </html>`;
    try {
        let transporter = nodemailer.createTransport({
            host: 'server.speed-trolley.com',
            port: 465,
            auth: {
                user: 'yogendra@jiocoins.co.in',
                pass: 'yogi@12!@34#$'
            }
        });
        var mailOptions = {
            from: 'info@jiocoins.co.in',
            to: mailData.to,
            subject: mailData.subject,
            text: mailData.html
        };
        transporter.sendMail(mailOptions, function (error, info) { });
    } catch (ex) { }


}

exports.authenticateRoute = async (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    // var token ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMjQzMjQzMjQzNDM0IiwiaWF0IjoxNTg2NzAwMDczLCJleHAiOjE1ODY3ODY0NzN9.jp-NXyMYIIGY8qvXs2o-mABmvUbI4_cODsOp8QzeTz0';
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        res.status(200).send(decoded);
    });

    res.status(200).json({
        success: true,
        msg: 'loggged in ',
        data: resp
    });
};

exports.userauthenticateToken = async (req, res, next) => {
    var token = req.body.token

    // var token ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMjQzMjQzMjQzNDM0IiwiaWF0IjoxNTg2NzAwMDczLCJleHAiOjE1ODY3ODY0NzN9.jp-NXyMYIIGY8qvXs2o-mABmvUbI4_cODsOp8QzeTz0';
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
            return res.status(500).send({ success: false, message: 'Failed to authenticate token.' });
        } else {
            res.status(200).json({
                success: true,
                msg: 'valid token'
            });
        }
    });


};

exports.otpMsg_new = (data) => {
    console.log("ooooooooo",data)
    //var html = '(' + data.otp + ') use this to verify '
    var html = 'is your OTP for sign-up.'+ data.otp ;
    var smsOptions = {
        to: data.mobileNumber,
        html: html
    };
    _this.sendOtpSMS_new(smsOptions);
}
exports.sendOtpSMS_new = (data) => {  
    var options = {
        method: 'POST',        
        url: `http://www.global91sms.in/app/smsapi/index.php?key=${constantAPIKey}&entity=${Entity}&tempid=${Tempid}&routeid=468&type=text&contacts=${data.to}&senderid=${_senderid}&msg=${data.html}`
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
    });
}

exports.sendOtpMail_new = (data) => {
    //let html = '(' + data.otp + ') use this to verify your email'
	let html='<tr bgcolor="#ed207b"><td style="padding: 10px 20px;"><h2 style="text-align: center;font-size: 22px; line-height: 28px; margin: 0px 0 0px; color: #fff;    padding: 10px;">Welcome to Partyyar</h2>';
	html+='</td></tr><tr><td style="padding: 10px 20px;"><h5 style="font-weight: 500;font-size: 16px;margin: 15px 0px 0px;">Hi User</h5></td> </tr>';
	html+='<tr><td style="padding: 10px 20px;"><p style="margin: 5px 0px;font-size: 16px;color: #444;">(' + data.otp + ') use this to verify your email</a></p></tr>';
    var mailOptions = {
        to: data.email,
        subject: 'OTP',
        html: html
    };
    sendMail_New(mailOptions);
}
const sendMail_New = (mailData) => {
   /* let html = `<html lang="en">
    <head>        
      <!-- Theme Made By www.w3schools.com - No Copyright -->
      <title>Bootstrap Theme The Band</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
    </head>
    <body>
    
    <div class="container">
    ${mailData.html}
    </div>
    
    </body>
    </html>`; */
	logo_image='<p style="text-align: center;"><a href="#"><img style="width: 120px;margin: auto;" src="'+img_src+'logo/logo.png"></a></p>';
	let html=`<!DOCTYPE html>
		<html>    
		<head>
			<meta charset="utf-8">
			<meta http-equiv="X-UA-Compatible" content="IE=edge">
			<title>MLG E-commerce</title>
			<meta name="description" content=" ">
		</head>
		<body style="background: #f9f9f9;">

			<table cellspacing="0" cellpadding="0" style="padding: 20px 0; background: #fff; max-width: 700px; width: 100%; margin: 40px auto; font-family:Cambria, 'Hoefler Text', 'Liberation Serif', Times, 'Times New Roman', serif;border: 1px solid #ddd;">
				<tr>
					<td style="text-align: center;">
						
						${logo_image}
						
					</td>
				</tr>
				${mailData.html}
			   <tr>
								<td style="padding: 10px 20px;"><p style="margin: 5px 0px;font-size: 16px;    color: #444;">We look forward to seeing you soon.</p></td></tr>
				<tr>
					<td style="padding: 10px 20px;">
						<p style="margin: 20px 0px 0;color: #444;font-size: 16px;">Thank you</p>
						<h4 style="margin: 5px 0px 0;">Partyyar</h4>
					</td>             
				</tr>
					 
			</table>
				
		</body>
		</html>`;
    try {
        let transporter = nodemailer.createTransport({
            host: 'server.speed-trolley.com',
            // // port: 465,
            // port: 587,
            // secure: false, 
            auth: {
                user: 'yogendra@jiocoins.co.in',
                pass: 'yogi@12!@34#$'
            }
        });
        var mailOptions = {
            from: 'info@jiocoins.co.in',
            to: mailData.to,
            subject: mailData.subject,
            text: mailData.html
        };
        transporter.sendMail(mailOptions, function (error, info) {
            console.log("error",error);
            console.log("infor",info);
         });
    } catch (ex) {
        console.log("ex",ex);
     }

  };