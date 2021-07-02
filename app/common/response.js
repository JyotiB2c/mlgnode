exports.msg = function(res, data) {
    switch (data.status) {
        case 200:
            var success = true;
            if (data.hasOwnProperty("success")) {
                success = data.success;
            }

            res.send({
                "statusCode": 200,
                "status": success,
                "message": data.msg,
                "data": data.data
            });
            break;

        case 204:
            res.send({
                "statusCode": 204,
                "status": false,
                "message": data.msg,
                "data": {}
            });
            break;

        case 400:
            res.send({
                "statusCode": 400,
                "status": false,
                "message": "Bad request",
                "data": {}
            });

            break;

        case 401:
            res.send({
                "statusCode": 401,
                "status": false,
                "message": "Unauthorized Request",
                "data": {}
            });

            break;

        case 500:
            res.send({
                "statusCode": 500,
                "status": false,
                "message": "Something went wrong",
                "data": {}
            });

            break;
        case 600:
            res.send(data.data);

            break;
    }

};