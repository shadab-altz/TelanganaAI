//const server = "13.126.211.244";
const server = "localhost";
//const port = 8080;
const port = 5000;

const getIndiaBasemapURL = 'http://' + server + ':' + port + '/getIndiaBasemap';
const getTelanganaBoundaryURL = 'http://' + server + ':' + port + '/getTelanganaBoundary';
const getTelanganaCameraTrapLocationsURL = 'http://' + server + ':' + port + '/getTelanganaCameraTrapLocations';
const getMonthlySightingStatisticsURL = 'http://' + server + ':' + port + '/getMonthlySightingStatistics';
const getRanges = 'http://' + server + ':' + port + '/getRanges';
const getSections = 'http://' + server + ':' + port + '/getSections';
const getSectionsCameraTrapsURL = 'http://' + server + ':' + port + '/getSectionsCameraTraps';
const getCameraimagesURL = 'http://' + server + ':' + port + '/getCameraimages';
const uploadImageFileURL = 'http://' + server + ':' + port + '/uploadImageFile';
const pollingURL = 'http://' + server + ':' + port + '/polling';
const getSpeciesHeatmapURL = 'http://' + server + ':' + port + '/getSpeciesHeatmap';
const getCameraStatisticsURL = 'http://' + server + ':' + port + '/getCameraStatistics';
const getStateStatisticsURL = 'http://' + server + ':' + port + '/getStateStatistics';