const express = require('express');
const router = express.Router();
const fs = require('fs');

router.get('/:id', function(req, res, next) {
  const id = req.params.id;
  const db = req.app.locals.db;
  const Videos = db.collection('videos');
  var video = {};

  Videos.findOne({id: id}, (err, doc) => {
    if(err) console.log('DB: Could retrieve record from DB: ', err);
    console.log("DB: record retrieved");
    if(!doc){
      video.err = "404: Video not found";

    } else {
      video = doc;
      var json = video.json;
      //var jsonStr = JSON.stringify(video.json, null, 2);
    }

    fs.readFile('./public/vtt/'+ id + '.vtt', 'utf8', (err, vttData) =>{
      // if(err) throw err;
      if(err) vtt = "Web VTT transcript not available.";

      res.render('video', {
         video: video,
         json: json,
         vtt: vttData
      });
    });
  });
});

module.exports = router;
