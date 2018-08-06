const express = require('express');
const router = express.Router();
const fs = require('fs');

router.post('/:id', function(req, res, next) {
  const id = req.params.id;
  const db = req.app.locals.db;
  const Videos = db.collection('videos');
  var video = {};

  Videos.deleteOne({id: id}, (err, doc) => {
    if(err) console.log('DB: Could Delete record from DB: ', err);
    console.log("DB: record deleted");

    res.status(200).send();
  });

});

module.exports = router;
