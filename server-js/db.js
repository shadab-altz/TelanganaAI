const config = require('config');
const Pool = require('pg').Pool
const fs = require('fs');
const uuid = require('uuid');
const { request } = require('http');
const AWS = require('aws-sdk');

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
const accessKeyId = config.get(appMode + '.accessKeyId')
const secretAccessKey = config.get(appMode + '.secretAccessKey')
const s3bucket = config.get(appMode + '.s3bucket')

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

const getIndiaBasemap = (request, response) => {
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getindiabasemap()")
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

const getMonthlySightingStatistics = (request, response) => {
    const { month } = request.body
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getMonthlySpeciesSighting($1)", [month])
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

const getSpeciesHeatmap = (request, response) => {
    const { month, species } = request.body
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getSpeciesHeatmap($1, $2)", [month, species])
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

    const s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    });

    if (request.files != null) {
        let imageInput = request.files.imageInput;
        var imageUUID = uuid.v4();
        var _name = imageUUID +"_" + imageInput.name.replaceAllTxt(" ", "_");
        var _fileUploadPath = fileUploadPath + _name;
        imageInput.mv(_fileUploadPath, function(err) {
            if (err)
                return response.status(500).send(err);

            fs.readFile(_fileUploadPath, (err, data) => {
                if (err) throw err;
                const params = {
                    Bucket: s3bucket,
                    Key: _name,
                    Body: data
                };
                s3.upload(params, function(s3Err, data) {
                    if (s3Err) throw s3Err
                    console.log(`File uploaded successfully at ${data.Location}`)
                    fs.unlink(_fileUploadPath, function(err){
                        if(err) return console.log(err);
                        console.log('file deleted successfully');
                    });
                    pool.connect()
                    .then(client => {
                        return client.query("SELECT * FROM sp_addimagefordetection($1)", [data.Location])
                            .then(res => {
                                client.release();
                                response.status(200).send({
                                    status: 'SUCCESS',
                                    uploadPath: data.Location,
                                    id: res.rows[0].sp_addimagefordetection
                                })
                            })
                            .catch(e => {
                                client.release();
                                console.log(e)
                            })
                    });
                });
            });
        });
    }
}

const polling = (request, response) => {
    const { pollid } = request.body
    pool.connect()
    .then(client => {
        return client.query("SELECT * FROM sp_getidentification($1)", [pollid])
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

module.exports ={
    getIndiaBasemap,
    getTelanganaBoundary,
    getRanges,
    getSections,
    getSectionsCameraTraps,
    getMonthlySightingStatistics,
    getTelanganaCameraTrapLocations,
    getCameraimages,
    getCameraStatistics,
    getSpeciesHeatmap,
    uploadImageFile,
    polling
}

String.prototype.replaceAllTxt = function replaceAll(search, replace) { return this.split(search).join(replace); }