var express = require('express')
var fs = require("fs")
var path = require("path")
var zipFolder = require('zip-folder');
var bodyParser = require('body-parser');
var app = express()
request = require('request')
const EventEmitter = require('events');
class MyEmitter extends EventEmitter { }
const myEmitter = new MyEmitter();
// var URL = process.env.appURL
URL = 'test.com'

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.set('port', (process.env.PORT || 5000))
//run function to set up required folders
appSetUp()
//set the contents of the public folder to be accessable to the public
app.use(express.static(__dirname + '/public'))

app.post('/downloadassets', function (req, res) {
    urls = req.body;
    alreadyDownloaded = [];
    dirName = createDir();

    for (i = 0; i < urls.length; i++) {
        console.log('i is '+ i);
        downloadImages(urls[i], dirName, urls.length, alreadyDownloaded);
    }
    //listen for event
    myEmitter.once('zipComplete', () => {
        zipLocation = URL + '/assets/' + dirName + '.zip';
        res.json({
            'url': zipLocation,
            'status': 'sucess'
        });
    })
});

app.listen(app.get('port'), function () {
    console.log('Reporting Server is running on port', app.get('port'))
});

function appSetUp() {
    //create the public folder and the assets folder 
    if (!fs.existsSync('public')) {
        fs.mkdirSync('public');
    }

    if (!fs.existsSync('public/assets')) {
        fs.mkdirSync('public/assets');
    }
}

function downloadImages(url, dirName, numberOfFiles, alreadyDownloaded) {
    var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            request(uri).pipe(fs.createWriteStream('./public/assets/' + dirName + "/" + filename)).on('close', callback);
        });
    };
    download(url, getFileName(url, dirName, alreadyDownloaded), function () {
        dir = './public/assets/' + dirName;
        fs.readdir(dir, (err, files) => {
            if (numberOfFiles === files.length) {
                console.log('all done');
                zipFolder('./public/assets/' + dirName, './public/assets/' + dirName + '.zip', function (err) {
                    if (err) {
                        console.log('oh no!', err);
                    } else {
                        console.log('complete')
                        myEmitter.emit('zipComplete');
                    }
                });
            }
        })
    });

}

function getFileName(url, dirName, alreadyDownloaded) {
    //split the url to just get the file name
    urlSplit = url.split("/");
    index = urlSplit.length - 1;
    //strip off the id that cloudinary adds
    splitFileName = urlSplit[index].split('.');
    newfile = splitFileName[0].substring(0, splitFileName[0].length - 7);
    //check if the filename is in use
    console.log(newfile + '.' + splitFileName[1]);
    console.log(fileExists(newfile + '.' + splitFileName[1], alreadyDownloaded));
    if (fileExists(newfile + '.' + splitFileName[1], alreadyDownloaded)) {
        e = 2;
        while (fileExists(newfile + '-' + e + '.' + splitFileName[1], alreadyDownloaded)) {
            console.log('increasing i')
            e++
        }
        //add the file extension back in
        renamedFile = newfile + '-' + e + '.' + splitFileName[1];
        alreadyDownloaded.push(renamedFile);
        return renamedFile;
    }
    else {
        //add the file extension back in
        fileWithFormat = newfile + '.' + splitFileName[1];
        //add file to download
        alreadyDownloaded.push(fileWithFormat);
        return fileWithFormat;
    }

}

function createDir() {
    var date = new Date();
    var datetime = date.getFullYear() + "-" + date.getDay() + "-" + date.getMonth() + "-" + date.getTime();
    var dir = 'asset_download-' + datetime;
    if (!fs.existsSync('./public/assets/' + dir)) {
        fs.mkdirSync('./public/assets/' + dir);
    }
    return dir;
}
function fileExists(fileName, alreadyDownloaded) {
    return alreadyDownloaded.includes(fileName);
}