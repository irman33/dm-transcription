const express = require('express');
const router = express.Router();
const fs = require('fs');
const rp = require('request-promise');

videoList = [];

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("/bc GET ACCESSED!");

  const db = req.app.locals.db;
  const Videos = db.collection('videos');

  Videos
  .find({}, {id:1, accountId:1, videoId: 1, videoName: 1, status: 1 })
  .sort({"updatedAt": -1})
  .toArray( (err, docs) => {
    if(err)
      console.log(err);
    else
      videoList = docs;
      //console.dir(videoList);

      res.render('bc', {
         title: 'Brightcove',
         videos: videoList
      });
  });
});

router.post('/', function(req, res, next) {
  console.log("/bc POST ACCESSED!");
  var accessToken = "";
  var searchResult = {
    id: "",
    name: "",
    refId: "",
    thumbnail: "",
    error: false,
    errorMsg: ""
  };
  const accountId = req.body.accountId;
  const searchBy = req.body.searchBy;
  const searchTerm = req.body.searchTerm;
  var uri_video = '';

  //console.log('searchBy:', searchBy);
  if(searchBy == 'id'){
    uri_video = 'https://cms.api.brightcove.com/v1/accounts/' + accountId +'/videos/'+ searchTerm;
  }
  else if(searchBy == 'refId'){
    uri_video = 'https://cms.api.brightcove.com/v1/accounts/' + accountId +'/videos/ref:'+ searchTerm;
  }

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
  }

  rp(options)
    .then((body) => {
      accessToken = body.access_token;
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
      //console.log('body: ', body);
      searchResult.id = body.id;
      searchResult.name = body.name;
      searchResult.refId = body.reference_id;
      searchResult.thumbnail = body.images.thumbnail.src;
      searchResult.account = accountId;
    })
    .catch((err) => {
      //console.log(err.StatusCodeError);
      searchResult.error = true;
      searchResult.errorMsg = err;
    })
    .finally(() =>{
      res.render('bcSearch', {
         title: 'Brightcove',
         search: searchResult,
         videos: videoList
      });
      res.status(200).send();
    });
});

module.exports = router;
