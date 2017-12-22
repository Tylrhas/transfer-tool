var express = require('express')
var fs = require("fs")
var path = require("path")
var zipFolder = require('zip-folder');
var bodyParser = require('body-parser');
var app = express()
request = require('request')

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.set('port', (process.env.PORT || 5000))

app.post('/downloadassets', function (req, res) {
    res.send(req.body);
    urls = req.body
    dirName = createDir();
    for (i = 0; i < urls.length; i++) {
        //console.log(urls.assets[i]['secure_url']);
        downloadImages(urls[i],dirName);
    }

    // zipFolder('/path/to/the/folder', '/path/to/archive.zip', function(err) {
    //     if(err) {
    //         console.log('oh no!', err);
    //     } else {
    //         console.log('EXCELLENT');
    //     }
    // });
});

app.listen(app.get('port'), function () {
    console.log('Reporting Server is running on port', app.get('port'))
});

function downloadImages(url, dirName) {

    var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);

            request(uri).pipe(fs.createWriteStream('assets/'+dirName+"/"+filename)).on('close', callback);
        });
    };
    download(url, getFileName(url), function () {
        console.log('done');
    });

}

function getFileName(url) {
    urlSplit = url.split("/");
    index = urlSplit.length - 1;
    return urlSplit[index];
}

function createDir(){
    var date = new Date();
    var datetime = date.getFullYear()+"-"+ date.getDay()+"-"+date.getMonth()+"-"+date.getTime();
    var dir = 'asset_download-'+datetime;
    if (!fs.existsSync('assets/'+dir)){
        fs.mkdirSync('assets/'+dir);
    }
    return dir;
}