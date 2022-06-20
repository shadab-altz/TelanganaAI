const config = require('config');
const fetch = require('cross-fetch');
const { response } = require('express');
var FormData = require('form-data');
const Pool = require('pg').Pool

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

const getLandingPageStatesBoundary = (request, response) => {
    pool.connect()
    .then(client => {
        return client.query('SELECT * FROM sp_getLandingPageStatesBoundary()')
            .then(res => {
                client.release();
                logger.log({
                    level: 'info',
                    //user: user_id,
                    method: 'getLandingPageStatesBoundary',
                    message:  JSON.stringify(res.rows)
                });
                response.status(200).send({data: res.rows})
            })
            .catch(e => {
                //client.release();
                logger.log({
                    level: 'error',
                    //user: user_id,
                    method: 'getLandingPageStatesBoundary',
                    message: e.stack
                });
            })
    });
}

const getStateStatistics = (request, response) => {
    const { name } = request.body
    pool.connect()
    .then(client => {
        return client.query('SELECT * FROM sp_getLandingPageStatesStatistics($1)', [name])
            .then(res => {
                client.release();
                logger.log({
                    level: 'info',
                    //user: user_id,
                    method: 'getLandingPageStatesBoundary',
                    message:  JSON.stringify(res.rows)
                });
                response.status(200).send({data: res.rows})
            })
            .catch(e => {
                //client.release();
                logger.log({
                    level: 'error',
                    //user: user_id,
                    method: 'getLandingPageStatesBoundary',
                    message: e.stack
                });
            })
    });
}

const getDivisions = (request, response) => {
    fetch('https://bhuvan-app1.nrsc.gov.in/ts_forest/get/getLocations.php?level=divison&circle=HYDERABAD',
    {
        method: "GET",
        headers: {
            "Content-Type": "text/json"
        },
    })
    .then(function(res) { 
        //console.log(res);
        return res })
    .then(function(data) {
        console.log(data);
        response.status(200).send(data)
    })
}

const getDistricts = (request, response) => {
    const { state_id} = request.body
    var formData = new FormData();
    formData.append('state_id', state_id);
    fetch('https://adminhierarchy.indiaobservatory.org.in/API/getDistricts',
    {
        method: "POST",
        body: formData
    })
    .then(function(res) { return res.text(); })
    .then(function(data) {
        response.status(200).send(data)
    })
}

const getSubDistricts = (request, response) => {
    const { district_id} = request.body
    var formData = new FormData();
    formData.append('district_id', district_id);
    fetch('https://adminhierarchy.indiaobservatory.org.in/API/getSubDistricts',
    {
        method: "POST",
        body: formData
    })
    .then(function(res) { return res.text(); })
    .then(function(data) {
        response.status(200).send(data)
    })
}

const getBlocks = (request, response) => {
    const { district_id} = request.body
    var formData = new FormData();
    formData.append('district_id', district_id);
    fetch('https://adminhierarchy.indiaobservatory.org.in/API/getBlocks',
    {
        method: "POST",
        body: formData
    })
    .then(function(res) { return res.text(); })
    .then(function(data) {
        response.status(200).send(data)
    })
}

const getBoundaryGeometry = (request, response) => {
    const { region_id} = request.body
    var formData = new FormData();
    formData.append('region_id', region_id);
    fetch('https://adminhierarchy.indiaobservatory.org.in/API/getGeometry',
    {
        method: "POST",
        body: formData
    })
    .then(function(res) { return res.text(); })
    .then(function(data) {
        response.status(200).send(data)
    })
}


module.exports = {
    getLandingPageStatesBoundary,
    getStateStatistics,
    getDivisions,
    getDistricts,
    getSubDistricts,
    getBlocks,
    getBoundaryGeometry
}