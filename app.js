const express = require('express');
const path = require('path');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const fs = require('fs');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const srtParser =  require('subtitles-parser');
const srt2vtt = require('srt-to-vtt');
const createSrt = require('./modules/createSrt');

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const url = 'mongodb://localhost:27017/transcription';

const index = require('./routes/index');
const transcript = require('./routes/transcript');
const transcribe = require('./routes/transcribe');
const watson = require('./routes/watson');
const upload = require('./routes/upload');
const google = require('./routes/google');
const bc = require('./routes/bc');
const remove = require('./routes/remove')
const video = require('./routes/video');
const helpers = require('./helpers');

const app = express();

var stt = new SpeechToTextV1 ({
  "username": "f0478b9f-338e-42c5-b4fb-af37085b990b",
  "password": "WTBNc6uOo0DB"
});

app.locals.stt = stt;

var stt_params = {
  'callback_url': 'http://devbox.mykaplan.tv/api/watson/results'
};

stt.registerCallback(stt_params, function(error, response) {
  if (error)
    console.log('Error:', error);
  else
    console.log(JSON.stringify(response, null, 2));
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', bc);  //app.use('/', index);
app.use('/transcript', transcript);
app.use('/transcribe', transcribe);
app.use('/api/watson', watson);
app.use('/api/upload', upload);
app.use('/google', google);
app.use('/bc', bc);
app.use('/video', video);
app.use('/remove', remove);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler + helpers
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');

  // helpers functions
  res.locals.h = helpers;
});

MongoClient.connect(url, (err, database) => {
  if(err) throw err;
  console.log('Mongo DB Connected...');

  app.locals.db = database;
  app.locals.videos = database.collection('videos');
});


module.exports = app;
