const express = require('express');
const router = express.Router();
const fs = require('fs');
const srtParser =  require('subtitles-parser');
const srt2vtt = require('srt-to-vtt')
const createSrt = require('../modules/createSrt');


/* GET home page. */
router.get('/results', function(req, res, next) {
  console.log("/api/watson GET ACCESSED!");
  let challenge_string = req.query.challenge_string;
  console.log(challenge_string);
  res.set('Content-Type', 'text/plain');
  res.status(200).send(challenge_string);
});

router.post('/results', function(req, res, next) {
  console.log("/api/watson POST ACCESSED!");
  console.dir(req.body);

  const id = req.body.user_token;
  const db = req.app.locals.db;
  const Videos = db.collection('videos');


  if(req.body.event == 'recognitions.completed_with_results'){
    console.log(req.body.user_token, "Job Done! Creating SRT/VTT");
    //console.log(req.body.results[0]);

    var fileName = req.body.user_token;
    var jsonData = req.body.results[0];
    var srtObjArr = [];
    var srtObj ={
       id: 0,
       startTime: 0,
       endTime: 0,
       text: ''
    }
    var timestampsArr = [];
    var wordConfidenceArr = [];
    var subNumber = 0;
    var textTranscript = "";
    var confidence = 0;
    var confidenceSum = 0;

    console.log('Write JSON');
    // Write the JSON FIle
    fs.writeFile('./public/json/'+fileName+'.json', JSON.stringify(jsonData, null, 2), function(err) {
      if(err) return console.log(err);
      console.log("The file was saved!");
      //createSRT(req.body.results, req.body.user_token);
    });

    //Create Text Transcript and Write Text File
    console.log('create Text');
    for(var i=0; i < jsonData.results.length; i++){
      textTranscript += jsonData.results[i].alternatives[0].transcript +"\r\n";
    }
    console.log('Write TEXT');
    fs.writeFile('./public/text/'+fileName+'.txt', textTranscript, function(err) {
      if(err) return console.log(err);
      console.log("The file was saved!");
    });


    //Get timestamped transcript array.
    //console.log('get timestampArr');
    console.log('get wordConfidenceArr');
    jsonData.results.forEach(function (result){
      timestampsArr = timestampsArr.concat(result.alternatives[0].timestamps);
      if(result.alternatives[0].word_confidence){
        wordConfidenceArr = wordConfidenceArr.concat(result.alternatives[0].word_confidence);
      }
    });

    // // calculate Overall confidence
    console.log('add wordConfidencetotal');
    // confidenceSum = wordConfidenceArr.reduce((total, num) => {
    //   console.log(total);
    //   return Number((total + num[1]).toFixed(3));
    // }, 0);

    console.log("word conf len: ", wordConfidenceArr.length);

    for(let i=0; i< wordConfidenceArr.length; i++){
      console.log("i: ", i , "word: ", wordConfidenceArr[i][0], "conf:", wordConfidenceArr[i][1]);
      confidenceSum += wordConfidenceArr[i][1];
    }

    console.log("wordConfidence.length: ", wordConfidenceArr.length);
    console.log('get wordConfidence average');
    confidence =  confidenceSum / wordConfidenceArr.length;

    console.log("Conf Length:", wordConfidenceArr.length);
    console.log("Conf Sum:", confidenceSum);
    console.log("Conf:", confidence);
    console.log("Conf Arr:", wordConfidenceArr);

    //Create SRT Object
    console.log("Create SRT Obj");
    for(let i=0; i<timestampsArr.length; i++){
      if(subNumber == 0){
        subNumber++;
        srtObj.startTime = timestampsArr[i][1]*1000;
      }
      if(srtObj.endTime - srtObj.startTime > 3000){
        srtObjArr.push(srtObj);
        subNumber++;
        srtObj ={
          id: subNumber.toString(),
          startTime: timestampsArr[i][1]*1000,
          endTime: timestampsArr[i][2]*1000,
          text: ''
        }
      }

      srtObj.id = subNumber.toString();
      srtObj.endTime = timestampsArr[i][2]*1000;
      srtObj.text = srtObj.text + timestampsArr[i][0] + ' ';
      // Logic for splitting text into two lines here
     }

     console.log("Create SRT")
     //Create SRT
     let srtString = srtParser.toSrt(srtObjArr);
     //Converte SRT to VTT
     console.log("Write SRT/VTT");
     fs.writeFile('./public/srt/' +fileName+ '.srt', srtString, function(err) {
       if(err) return console.log(err);
       console.log("The SRT file was saved!");
       fs.createReadStream('./public/srt/' +fileName+ '.srt')
       .pipe(srt2vtt())
       .pipe(fs.createWriteStream('./public/vtt/' +fileName+ '.vtt'));
     });

     //DB Update
     console.log("Write DB - Completed")
     Videos.updateOne({id:id}, {$set: {
       status: "Transcription Completed.",
       json: jsonData,
       text: textTranscript,
       srt: srtString,
       confidence: confidence,
       wordConfidenceArr: wordConfidenceArr,
       updatedAt: new Date()}
     }, (err, r) => {
       if(err) console.log('Could not update "Transcription Completed." status in DB', err);
       console.log("DB: Stutus updated: Transcription Completed.");
     });

   }

   if(req.body.event == 'recognitions.started'){
     console.log(req.body.user_token, "Processsing...");

     //DB Update
     Videos.updateOne({id:id}, {$set: {
       status: "Watson Transcription Started...",
       updatedAt: new Date()}
     }, (err, r) => {
       if(err) console.log('Could not update "Watson Transcription Started...." status in DB', err);
       console.log("DB: Stutus updated: Watson Transcription Started...");
     });
  }
  res.status(200).send();
});

module.exports = router;
