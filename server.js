var express = require('express')
var fs = require("fs")
const Path = require('path')
var zipFolder = require('zip-a-folder')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()
var URL = process.env.appURL
//URL = 'test.com'

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.set('port', (process.env.PORT || 5000))
//run function to set up required folders
appSetUp()
//set the contents of the public folder to be accessable to the public
app.use(express.static(__dirname + '/public'))

app.post('/downloadassets', async function (req, res) {
  let urls = req.body
  let dirName = createDir()
  await downloadImages(urls, dirName)
  await zipFolder.zip(`public/assets/${dirName}`, `public/assets/${dirName}.zip`)
  let zipLocation = `${URL}/assets/${dirName}.zip`
  res.json({
    'url': zipLocation,
    'status': 'sucess'
  })
})

app.listen(app.get('port'), function () {
  console.log('Reporting Server is running on port', app.get('port'))
})

function appSetUp() {
  //create the public folder and the assets folder 
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }

  if (!fs.existsSync('public/assets')) {
    fs.mkdirSync('public/assets');
  }
}
function downloadImages(urls, dirName) {
  let images = []
  for (i = 0; i < urls.length; i++) {
    images.push(downloadImage(urls[i], dirName))
  }
  return Promise.all(images)
}
function downloadImage(url, dirName) {
  let filename = getFileName(url)
  const path = Path.resolve(__dirname, 'public', 'assets', `${dirName}`, `${filename}`)
  return request(url).pipe(fs.createWriteStream(path))

}

function getFileName(url) {
  //split the url to just get the file name
  let urlSplit = url.split("/")
  let index = urlSplit.length - 1
  let newfileName = urlSplit[index]
  return newfileName
}

function createDir() {
  var date = new Date();
  var datetime = `${date.getFullYear()}-${date.getDay()}-${date.getMonth()}-${date.getTime()}`
  var dir = `asset_download-${datetime}`
  if (!fs.existsSync('./public/assets/' + dir)) {
    fs.mkdirSync('./public/assets/' + dir);
  }
  return dir;
}