const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');


var stt = new SpeechToTextV1 ({
  username: '34dbc8fa-cfd4-4b87-b833-657698bd7e44',
  password: 'SrO4CCpYO0Nw'
});

var audioFile= "";
var audioFileExt= "";
var contentType = 'audio/ogg';

/* GET home page. */
router.post('/', function(req, res, next) {
  console.log("/api/upload ACCESSED!");
  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '../public/audio');
  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name), function(){
      let tempFileName = file.name.split(".");
      //audioFile =  tempFileName[0];
      audioFile = file.name;
      audioFileExt =  tempFileName[1];

      if (audioFileExt == "ogg")
        contentType = 'audio/ogg';
      else if (audioFileExt == "wav")
        contentType = 'audio/wav';

      // Asyncrounous callback registry
      let stt_params = {
        'content_type': contentType,
        audio: fs.createReadStream('./public/audio/'+audioFile),
        continuous: true,
        timestamps: true,
        inactivity_timeout: -1,
        'max_alternatives': 3,
        'word_confidence': true,
        'callback_url': 'http://devbox.mykaplan.tv/api/watson/results',
        'user_token': audioFile,
        events: 'recognitions.started,recognitions.completed_with_results,recognitions.failed'
      };

      //Create a new Watson job
      stt.createRecognitionJob(stt_params, function(error, job) {
        if (error)
          console.log('Error:', error);
        else
          console.log("Job created!");
          console.log(JSON.stringify(job, null, 2));

          const db = req.app.locals.db;
          const Videos = db.collection('videos');
          const video = {
            'watson_id': job.id,
            'watson_url': job.url,
            'watson_created': job.created,
            status: "Job Created",
            'user_token': audioFile
          }
          //DB write
          Videos.insert(video, (err, result) => {
            if(err){
              return console.log(err);
            }
            console.log('Video saved in DB..');
          })


      });
    });
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');

  });

  // parse the incoming request containing the form data
  form.parse(req);

});

module.exports = router;
