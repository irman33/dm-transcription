const express = require('express');
const router = express.Router();
const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');
const request = require('request');
const rp = require('request-promise');
const ffmpeg = require('ffmpeg');
const uuid = require('uuid');
const Promise = require('promise');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');


router.post('/:account/:id', function(req, res, next) {
  const stt = req.app.locals.stt;
  var videoId = req.params.id;
  var accountId = req.params.account;
  var model = req.query.model || 'en-US_BroadbandModel';
  var customization_id = req.query.customization_id;
  var id = `${uuid.v4()}`;
  var fileName = id;
  var accessToken ="";
  const db = req.app.locals.db;
  const Videos = db.collection('videos');

  video = {
    id: fileName,
    accountId: accountId,
    videoId: videoId,
    videoName: "",
    watsonId: "",
    status: "Processing...",
    json: {},
    text: "",
    vtt: "",
    srt: "",
    updatedAt: new Date(),
    source: "",
    model: model,
    customization_id : customization_id
  }

  Videos.insertOne(video, (err, r) =>{
      if(err) console.log('DB: Could not write to DB: ', err);
      console.log("DB: Created record in DB");
  })

  let options = {
    uri: 'https://oauth.brightcove.com/v3/access_token',
    method: 'POST',
    auth: {
      user: '3f584185-19de-48e2-8f57-7d36d7e82dc3',
      pass: 'OYTsKPAXGGVouMCdf2rkfLwrbF4aWyzw3A2p_dXmLwmqLQlxJAMYjIP3x2JkBvnZooXSqbbgGNVDIp3kx_06pw'
    },
    form: {
      'grant_type': 'client_credentials'
    },
    json: true
  };

  rp(options)
    .then((body) => {
      accessToken = body.access_token;
      uri_video = 'https://cms.api.brightcove.com/v1/accounts/' + accountId +'/videos/'+ videoId;
      let options = {
        uri: uri_video,
        auth: {
           bearer: accessToken,
        },
        json: true
      }
      return rp(options);
    })
    .then((body) => {
      //accessToken = body.access_token;
      videoName = body.name;
      uri_video = 'https://cms.api.brightcove.com/v1/accounts/' + accountId +'/videos/'+ videoId + '/sources';
      let options = {
        uri: uri_video,
    	  auth: {
    	     bearer: accessToken,
        },
        json: true
      }
      return rp(options);
    })
    .then(downloadVideo)
    .then(convertVideo)
    .then(transcribeAudio)
    .catch((err) => {
      console.log('Catch Error', err);
    });

  res.redirect('/bc');

  function downloadVideo(body){
    return new Promise(
      function(resolve, reject){
        console.log('DOWNLOAD VIDEO');

        // GOTTA FIND A BETTER WAY TO PULL THE ASSET
        let sourceVideo = body[1].src + ".mp4";

        let path = './videos/' + fileName + ".mp4";
        var file = fs.createWriteStream(path);
        console.log(path);

        // Update DB, Status and srouce
        Videos.updateOne({id:id}, {$set: {
          status: "Downloading Video...",
          videoName: videoName,
          source: sourceVideo,
          updatedAt: new Date()}
        }, (err, r) => {
          if(err) console.log('Could not update "Downloading Video..." status in DB', err);
          console.log("DB: Stutus updated: Downloading Video...");
        });

        var stream = request(sourceVideo).pipe(file);
        stream.on('finish', () =>{
          resolve(fileName);
        });
        stream.on('error', (err) =>{
          reject(err);
        });
      }
    )
  }




// ffmpeg params: /usr/bin/ffmpeg -i /tmp/video.mp4 -vn -acodec opus -profile:a aac_he -b:a 16k -bits_per_raw_sample 16 -ar 16000 /tmp/output.ogg
// ffmpeg params: /usr/bin/ffmpeg -i /var/www/dm-transcription/video/f983bb69-c9d9-4c81-8b84-6b1f77b75592.mp4 -vn -acodec opus -profile:a aac_he -b:a 16k -bits_per_raw_sample 16 -ar 16000 /var/www/dm-transcription/public/audio/f983bb69-c9d9-4c81-8b84-6b1f77b75592.ogg
    //


  // Using FFMPEG Command line - Kevin settings
    // function convertVideo(fileName){
    //   return new Promise(
    //     function(resolve, reject) {
    //       let cmd = `ffmpeg -i ./videos/${fileName}.mp4 -vn -acodec libopus -profile:a aac_he -b:a 16k -bits_per_raw_sample 16 -ar 16000 ./public/audio/${fileName}.ogg`
    //       console.log(cmd)
    //
    //       exec(cmd, (err, stdout, stderr) => {
    //         if (err) {
    //           console.error(err);
    //           reject(err);
    //         }
    //         console.log(stdout);
    //         resolve(fileName);
    //       });
    //     }
    //   )
    // }


  function convertVideo(fileName){
    return new Promise(
      function(resolve, reject) {
        console.log('CONVERT VIDEO');
        let path_src = './videos/' + fileName + '.mp4';
        let path_dest = './public/audio/' + fileName + '.ogg';

        var process = new ffmpeg(path_src);
        Videos.updateOne({id:id}, {$set: {
          status: "Converting Video...",
          updatedAt: new Date()}
        }, (err, r) => {
          if(err) console.log('DB: Could not update "Converting Video..." status in DB', err);
          console.log("DB: Stutus updated: Converting Video...");
        });

      	process.then((video) => {
      		video
          .setDisableVideo()
          //ADDED
          // .setAudioCodec('libopus')
          // .setAudioFrequency(16)
          //
          // // End add
      		.save(path_dest, (error, file) => {
      			if (!error)
              resolve(fileName);
            else
              reject(error);
      				//console.log('file: ' + file);
      		});
      	}, (err) => {
      		console.log('Error: ' + err);
          reject(err);
      	});
      }
    )
  }


  function transcribeAudio(fileName){
    let stt_params = {
      model: model,     // en-US_NarrowbandModel  en-US_BroadbandModel
      'content_type': 'audio/ogg',
      audio: fs.createReadStream('./public/audio/'+fileName+'.ogg'),
      timestamps: true,
      'inactivity_timeout': -1,
      'max_alternatives': 3,
      'word_confidence': true,
      'callback_url': 'http://devbox.mykaplan.tv/api/watson/results',
      'user_token': fileName,
      events: 'recognitions.started,recognitions.completed_with_results,recognitions.failed'
    };
    if(customization_id){
      stt_params.customization_id = customization_id;
    }


    //Create a new Watson job
    stt.createRecognitionJob(stt_params, (error, job) => {
      if (error)
        console.log('Error:', error);
      else{
        console.log("Job created!");
        console.log(JSON.stringify(job, null, 2));
        console.log(job.id);

        Videos.updateOne({id:id}, {$set:{
          status: "Transcribing Audio (Watson)...",
          watsonId: job.id,
          updatedAt: new Date()}
        }, (err, r) => {
          if(err) console.log('DB: Could not update "Transcribing Audio (Watson)..." status in DB', err);
          console.log("DB: Stutus updated: Transcribing Audio (Watson)...");
        });
      }
    });
  }
});

module.exports = router;
