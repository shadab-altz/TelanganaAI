const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const cors = require('cors');
const path = require('path');
const db = require('./server-js/db')
const ab = require('./server-js/admin-boundaries')
const config = require('config');

var appMode;
if(process.argv[2] == "dev")
    appMode = "Development";
else if(process.argv[2] == "production")
    appMode = "Production";
else if(process.argv[2] == "staging")
    appMode = "Staging";
else
    appMode = "Development";
console.log(appMode)

const port = config.get(appMode + '.appPort');

const app = express()
app.use(bodyParser.json({limit: '50mb'}))
app.use(cors())
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
)

app.use(express.static(path.join(__dirname, '/css')))
app.use(express.static(path.join(__dirname, '/js')))
app.use(express.static(path.join(__dirname, '/img')))

app.get('/map', function(req, res) {
    res.sendFile(path.join(__dirname, '/html/map.html'));
});

app.get('/getTelanganaBoundary', (request, response) => {
    db.getTelanganaBoundary(request, response)
})

app.post('/getRanges', function(request, response) {
    db.getRanges(request, response)
});

app.post('/getSections', function(request, response) {
    db.getSections(request, response)
});

app.post('/getSectionsCameraTraps', function(request, response) {
    db.getSectionsCameraTraps(request, response)
});

app.post('/getCameraimages', function(request, response) {
    db.getCameraimages(request, response)
});

app.post('/getTelanganaCameraTrapLocations', function(request, response) {
    db.getTelanganaCameraTrapLocations(request, response)
});

app.listen(port, () => {
    console.log("App running on port: " + port)
})