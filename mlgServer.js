const express = require('express'),
    app = express()
bodyParser = require('body-parser');
let port = process.env.PORT || 7000;
console.log('API server starting on : ' + port);
app.listen(port, function () {
    console.log("Server listening on port:%s", port);
});
console.log('API server started on  port : ' + port);
var cors = require('cors')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use('/api/', require('./app/routes/userRoutes'));
app.use('/api/', require('./app/routes/productRoutes'));
app.use('/api/', require('./app/routes/checkoutRoutes'));
app.use('/api/', require('./app/routes/orderRoutes'));
app.use('/api/', require('./app/routes/customerRoutes'));
app.use(function (req, res) {
    // Invalid request
    res.send({
        "statusCode": 500,
        "status": false,
        "message": "no route found",
        "data": {}
    });
});