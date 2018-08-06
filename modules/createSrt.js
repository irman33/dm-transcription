var fs = require('fs');
var srtParser =  require('subtitles-parser');
var srt2vtt = require('srt-to-vtt')

console.log("MODULE STARTED");

function createSrt(data, fileName) {

  console.log('createSRT');
  // let srtObjArr = [];
  // let srtObj ={
  //   id: 0,
  //   startTime: '',
  //   endTime: '',
  //   text: ''
  // }
  // let timestampsArr = [];
  // let subNumber = 0;
  //
  // //Get timestamped transcript array.
  // data.results.forEach(result => {
  //   timestampsArr = timestampsArr.concat(result.alternatives[0].timestamps)
  // });
  //
  // console.log("Timestamped array", timestampsArr);
  //
  // for(let i=0; i<timestampsArr.length; i++){
  //   if(subNumber == 0){
  //     subNumber++;
  //     srtObj.startTime = timestampsArr[i][1]*1000;
  //   }
  //   if(srtObj.endTime - srtObj.startTime > 3000){
  //     srtObjArr.push(srtObj);
  //     subNumber++;
  //     srtObj ={
  //       id: subNumber.toString(),
  //       startTime: timestampsArr[i][1]*1000,
  //       endTime: timestampsArr[i][2]*1000,
  //       text: timestampsArr[i][0] + ' '
  //     }
  //   }
  //
  //   srtObj.id = subNumber.toString();
  //   srtObj.endTime = timestampsArr[i][2]*1000;
  //   srtObj.text = srtObj.text + timestampsArr[i][0] + ' ';
  //   // Logic for splitting text into two lines here
  //
  //
  // }
  // console.log("Done Creating SRT Obj");
  //
  // let srtString = srtParser.toSrt(srtObjArr);
  // fs.writeFile('./public/srt/' +audioFile+ '.srt', srtString, function(err) {
  //   if(err) return console.log(err);
  //   console.log("The SRT file was saved!");
  //   fs.createReadStream('./public/srt/' +audioFile+ '.srt')
  //   .pipe(srt2vtt())
  //   .pipe(fs.createWriteStream('./public/vtt/' +audioFile+ '.vtt'));
  // });
}


module.exports = createSrt;
