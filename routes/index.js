var express = require('express');
var router = express.Router();
var fs = require('fs');


const jsonFolder = './public/json/';
const audioFolder = './public/audio/';

/* GET home page. */
router.get('/', function(req, res, next) {

  let status = [];
  let audioFiles = [];

  fs.readdir(audioFolder, (err, files) => {
    files.forEach(file => {
      console.log(file);
      let fileName = file;
      let obj = {};
      obj.fileName = fileName;
      if (fs.existsSync('public/json/' + fileName + '.json')){
        obj.status = "Done";
      }else {
        obj.status = "Not Transcribed";
      }
      status.push(obj);
    });

    res.render('index', {
       title: 'Home',
       //audioFiles: audioFiles
       status: status
    });
  });
});

module.exports = router;
