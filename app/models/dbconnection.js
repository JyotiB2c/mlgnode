const { Sequelize, QueryTypes, INTEGER } = require('sequelize');
var config = require('../config/constant');
var sequelize = new Sequelize(config.mydb, config.mydbuser, config.mydbpassword, {
    host: config.myhost,
    dialect: config.mydialect,
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    logging: false,
    define: {
        timestamps: false,
        freezeTableName: true,
        underscored: true,
        underscoredAll: true
      },
});  

module.exports = {
    sequelize,
    QueryTypes
}