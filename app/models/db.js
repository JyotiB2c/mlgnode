'user strict';

var mysql = require('mysql');

//local mysql db connection   
var connection = mysql.createConnection({
    host: "localhost",
    user: "jiocoins_mlg",
    password: "PWTFrqcSI0Pc",
    database: "jiocoins_mlg"
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;