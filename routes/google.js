var express = require('express');
var router = express.Router();
var fs = require('fs');

var speech = require('@google-cloud/speech')({
  keyFilename: 'transcription-4b7ff2ff1b3e.json'
});


/* GET home page. */
router.get('/', function(req, res, next) {

  console.log('Route /google');

  var config = {
    encoding: 'FLAC',
    languageCode: 'en-US',
    verbose: false
  };

  function startRecognitionCallback(err, operation, apiResponse) {
    if (err) {
      console.log(err);
    }

    operation
      .on('error', function(err) {
        console.log('Error: ' + err);
      })
      .on('complete', function(transcript) {
        console.log("Transcript Complete: ");
        console.log(transcript);
      });
  }

  console.log("Starting Google Speech Recognition.");
  speech.startRecognition('gs://transcription-audio/5.flac', config, startRecognitionCallback);

  res.render('google', {
     title: 'Google'
  });



});

module.exports = router;
