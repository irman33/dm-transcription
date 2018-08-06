var express = require('express');
var router = express.Router();
var fs = require('fs');

router.get('/:fileName', function(req, res, next) {
  var fileName = req.params.fileName;
  var json = "";
  var text = "";
  var srt= "";
  var vtt= "";
  var jsonStr ="";
  fs.readFile('./public/text/'+ fileName + '.txt', 'utf8', function(err, textData){
    //if(err) throw err;
    if(err) text = "Not yet Transcribed. Transcript not available.";
    else text = textData;

    fs.readFile('./public/srt/'+ fileName + '.srt', 'utf8', function(err, srtData){
      // if(err) throw err;
      if(err) srt = "SRT transcript not available."
      else srt = srtData;

      fs.readFile('./public/vtt/'+ fileName + '.vtt', 'utf8', function(err, vttData){
        // if(err) throw err;
        if(err) vtt = "Web VTT transcript not available.";
        else vtt = vttData;

        fs.readFile('./public/json/'+ fileName + '.json', 'utf8', function(err, data){
          // if(err) throw err;
          if(err){
            jsonStr = "Not yet Transcribed. JSON not available.";
          }
          else{
            json = JSON.parse(data, null, "\t");
            jsonStr  =  JSON.stringify(json, null, 2);
          }
          res.render('transcript', {
             fileName: fileName,
             text: text,
             json: jsonStr,
             srt: srt,
             vtt: vtt
          });
        });
      });
    });
  });
});

module.exports = router;
