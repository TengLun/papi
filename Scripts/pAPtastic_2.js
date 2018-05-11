// import standard modules
var https = require("https");
var fs = require("fs");
var events = require("events");

// spawnPool
var spawnPool = new events.EventEmitter();

// construct file request Body
var fileRequestBody = {

    	"api_key": "E04B4A8E-18EC-4C29-971B-5F2975F09591",
    	"app_guid": "koturnlund-ios56255e9b52c91",
    	"time_start": "1470017690",
    	"time_end": "1470617690",
    	"traffic": [
    		"install"
    	],
    	"traffic_filtering": {
    	},
    	"delivery_format": "csv",
    	"delivery_method": [
    		"S3link"
    	],
    	"notify": [
            "sturnlund@kochava.com"
    	]
}
var fileRequestHeader = {
    "hostname":"reporting.api.kochava.com",
    "path":"/detail",
    "method":"POST"
}


var checkStatusHeader = {
    "hostname":"reporting.api.kochava.com",
    "path":"/progress",
    "method":"POST",
    "Connection": "keep-alive"
}

var checkStatusBody = {

    "api_key": "",
    "app_guid": "",
    "token": ``
}


// construct Functions// Define Functions
function queue(){

    this.stac=new Array();

    this.retrieve=function(){
        return this.stac.pop();
    };

    this.queue=function(item){
        this.stac.unshift(item);
    };

    this.read=function(){
        return this.stac.toString();
    }

};
var fileTokenQueue = new queue();
var fileDownloadQueue = new queue();

// response data Array
var responseFiling = [];

// request the report
var requestFile = https.request(fileRequestHeader, (response)=>{

    var body = [];
    var token = {};

    response.on("data",(data)=>{
        body.push(data);
    }).on("end",()=>{
        token = JSON.parse(Buffer.concat(body).toString());
        fileTokenQueue.queue(token.report_token.toString());

        spawnPool.emit("Queued");

    }).on("error",()=>{


    })

})

// check status of report
var checkStatus = https.request(checkStatusHeader,(response)=>{

    console.log("     check sent")
    var body = [];
    var completedCheck = {};

    response.on("data",(data)=>{
        console.log("     data being received")
        body.push(data);
    }).on("end",()=>{
        console.log("     response finished")
        completedCheck = JSON.parse(Buffer.concat(body).toString());

        if (completedCheck.status.toString() == "completed"){
            fileDownloadQueue.queue(completedCheck.report.toString());
            spawnPool.emit("completed");
            console.log("complete")
            console.log(fileDownloadQueue.retrieve.toString())
        } else if (completedCheck.status.toString() == "queued") {
            checkStatus.end();
            fileTokenQueue.queue(checkStatusBody.token.toString()) ;
            console.log("Still Queued")
            checkStatus.on("finish",()=>{
                spawnPool.emit("Queued")
            })

        } else {
        }
    }).on("error",(error)=>{
        console.log(`Error Thrown: ${error.toString()}`)
        spawnPool.emit("Queued");
    })
})

// download the file to a csv
// var downloadFile = https.request(`${fileDownloadQueue.retrieve.toString()}`,(response)=>{
//
//     var body = [];
//
//     response.on("data",(data)=>{
//         body.push(data);
//     }).on("end",()=>{
//         body = Buffer.concat(body).toString();
//         console.log(body);
//     })
// })



requestFile.write(JSON.stringify(fileRequestBody));
requestFile.end();

spawnPool.on("Queued",()=>{
    console.log("spawnPool: Queued")

    // construct check status body
    checkStatusBody = {

    	"api_key": "E04B4A8E-18EC-4C29-971B-5F2975F09591",
    	"app_guid": "koturnlund-ios56255e9b52c91",
    	"token": `${fileTokenQueue.retrieve().toString()}`
    }

    console.log("check sending")
    checkStatus.write(JSON.stringify(checkStatusBody),()=>{

    })
    checkStatus.end(()=>{
        console.log("finished")
    })


})

spawnPool.on("completed",()=>{
    console.log("spawnPool: completed")
    downloadFile.write(fileDownloadQueue.retrieve.toString(),()=>{
            downloadFile.end();
    })


});

process.on('uncaughtException', function (err) {
    console.log(err);
});
