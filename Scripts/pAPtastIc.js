// Import Modules
var https = require("https");
var fs = require("fs");
var events = require("events");
var date = require("datejs");

// Define Objects and Variables
var spawnPool = new events.EventEmitter();

// Request Report Variables
var requestReportOptions = {
    hostname: "reporting.api.kochava.com",
    path: "/detail",
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
}
var requestReportBody = {


	"api_key": "E04B4A8E-18EC-4C29-971B-5F2975F09591",
	"app_guid": "koturnlund-ios56255e9b52c91",
	"time_start": "1466573093",
	"time_end": "1486573093",
	"traffic": [
		"install"
	],
	"traffic_filtering": {
	},
	"delivery_format": "JSON",
	"delivery_method": [
		"S3link"
	],
	"notify": [
		"sturnlund@kochava.com"
	]

}
var requestReport = https.request(requestReportOptions, (response) => {

    var body = [];

    response.on("data", (data) => {
        body.push(data);
    }).on("end", () => {
        body = JSON.parse(Buffer.concat(body).toString());
        if(body.status.toString() === "queued") {
            reportQueue.queue(parseInt(body.report_token));
        } else {

        }
        spawnPool.emit('reportQueued')
    }).on("error", (error) => {
        console.log(error)
    });
})
var reportQueue = new queue();

// Request Report Variables
var requestStatusOptions = {
    hostname: "reporting.api.kochava.com",
    path: "/progress",
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
}
var requestStatusBody = {

    "API_key": "E04B4A8E-18EC-4C29-971B-5F2975F09591",
    "app_guid": "koturnlund-ios56255e9b52c91",
    "token": ""
}
var requestStatus = https.request(requestStatusOptions, (response) => {

    var body = [];

    response.on("data", (data) => {
        body.push(data);
    }).on("end", () => {
        body = JSON.parse(Buffer.concat(body).toString());
        console.log(body.toString());
        return body;
    }).on("error", (error) => {
        console.log(error)
    });
}).on('error', (error) => {
    console.log(error);
});

var statusQueue = new queue();
var finishedQueue = new queue();

// Define Functions
function queue(){

    this.stac=new Array();

    this.retrieve=function(){
        return this.stac.pop();
    };

    this.queue=function(item){
        this.stac.unshift(item);
    };

};

function checkStatus(){
    var currentToken = reportQueue.retreive();
    var requestStatusObject = new requestStatusbody();
    requestStatusObject.token = currentToken.report_token
    var currentTokenStatus = requestStatus(requestStatusObject)
    if(currentTokenStatus.status === "completed"){
        finishedQueue.queue(currentTokenStatus.report.toString());
        spawnPool.emit('reportFinished');
    } else if (currentTokenStatus.status === "queued"){
        reportQueue.queue(currentToken);
    } else {
        // Do something super special and nice for someone.
    }

}

function downloadReport(){

}
console.log(JSON.stringify(requestReportBody))
requestReport.write(JSON.stringify(requestReportBody));
requestReport.end("request done.");

spawnPool.on('requestQueued', checkStatus)
spawnPool.on('reportFinished', downloadReport)
