const config = require('config');
const Pool = require('pg').Pool
const fs = require('fs')

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

module.exports ={
    getTelanganaBoundary,
    getRanges,
    getTelanganaCameraTrapLocations
}