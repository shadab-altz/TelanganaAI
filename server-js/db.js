const config = require('config');
const Pool = require('pg').Pool
const fs = require('fs');
const uuid = require('uuid');
const { request } = require('http');

var appMode;
if(process.argv[2] == "dev")
    appMode = "Development";
else if(process.argv[2] == "production")
    appMode = "Production";
else if(process.argv[2] == "staging")
    appMode = "Staging";
else
    appMode = "Development";

const dbConfig = config.get(appMode + '.dbConfig');
const fileUploadPath = config.get(appMode + '.fileUploadPath')

const pool = new Pool(dbConfig)

const getTelanganaBoundary = (request, response) => {
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getTelanganaBoundary()")
            .then(res => {
                client.release();
                response.status(200).send({data: res.rows})
            })
            .catch(e => {
                client.release();
                console.log(e)
            })
    });
}

const getRanges = (request, response) => {
    const { month } = request.body
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getRanges($1)", [month])
            .then(res => {
                client.release();
                response.status(200).send({data: res.rows})
            })
            .catch(e => {
                client.release();
                console.log(e)
            })
    });
}

const getSections = (request, response) => {
    const { month, range } = request.body
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getSections($1, $2)", [month, range])
            .then(res => {
                client.release();
                response.status(200).send({data: res.rows})
            })
            .catch(e => {
                client.release();
                console.log(e)
            })
    });
}

const getSectionsCameraTraps = (request, response) => {
    const { month, range, section } = request.body
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getSectionCameraTraps($1, $2, $3)", [month, range, section])
            .then(res => {
                client.release();
                response.status(200).send({data: res.rows})
            })
            .catch(e => {
                client.release();
                console.log(e)
            })
    });
}

const getCameraimages = (request, response) => {
    const { camera } = request.body
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getCameraimages($1)", [camera])
            .then(res => {
                client.release();
                response.status(200).send({data: res.rows})
            })
            .catch(e => {
                client.release();
                console.log(e)
            })
    });
}

const getCameraStatistics = (request, response) => {
    const { camera } = request.body
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getCameraStatistics($1)", [camera])
            .then(res => {
                client.release();
                response.status(200).send({data: res.rows})
            })
            .catch(e => {
                client.release();
                console.log(e)
            })
    });
}

const getTelanganaCameraTrapLocations = (request, response) => {
    const { month } = request.body
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getTelanganaCameraTrapLocations($1)", [month])
            .then(res => {
                client.release();
                response.status(200).send({data: res.rows})
            })
            .catch(e => {
                client.release();
                console.log(e)
            })
    });
}

const uploadImageFile = (request, response) => {
    if (request.files != null) {
        let imageInput = request.files.imageInput;
        var imageUUID = uuid.v4();
        var _name = imageUUID +"_" + imageInput.name.replaceAllTxt(" ", "_");
        var _fileUploadPath = fileUploadPath + _name;
        imageInput.mv(_fileUploadPath, function(err) {
            if (err)
                return response.status(500).send(err);
            response.status(200).send({status: 'SUCCESS', uploadPath: _fileUploadPath});
        });
    }
}

module.exports ={
    getTelanganaBoundary,
    getRanges,
    getSections,
    getSectionsCameraTraps,
    getTelanganaCameraTrapLocations,
    getCameraimages,
    getCameraStatistics,
    uploadImageFile
}

String.prototype.replaceAllTxt = function replaceAll(search, replace) { return this.split(search).join(replace); }