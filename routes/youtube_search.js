var express = require('express');
const request = require('request');
const {spawn} = require('child_process');

var router = express.Router();
/* TODO: Generate API KEY from https://console.developers.google.com  */
const YOUTUBE_API_KEY = 'AIzaSyD8y5Y3zL2VlZsAlAmfvgNoFJljEmUDZKk';

/* GET video listing. */
router.get('/:query', function(req, res, next) {
    let query = req.params.query;/*already encoded */
    
    /* Youtube API Request with KEY */
    request(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${YOUTUBE_API_KEY}`,
    (err,resp,body)=>{
        if(err){
            console.log('YOUTUBE_API - Request failed');
            next(err);
        }
        else{
            res.send(body).status(200);
        }
    });

});

/* Send mp3 download for video_id youtube */
router.get('/download/audio/:vid/:name?', (req,res,next)=>{
    let {vid,name} = req.params;
    vid = decodeURIComponent(vid);/*video id */
    name = name? decodeURIComponent(name):vid;/* Name: Optional Parameter for sending `name`.mp3 */
    
    //youtube-dl -x --audio-format mp3 http://www.youtube.com/watch?v=8veo4Uf6CR8 -f bestaudio   

    /*Perfect CODE  */

    try {
            /* response attachment for triggering download instead of stream */
            res.attachment(`[Grabber]${name}.mp3`);
            
            /* For Extracting mp3 from video stream of youtube-dl , on the fly(pipe) */
            let ffplay_child = spawn("ffmpeg", [
                '-i', //input
                'pipe:0', //stdin
                '-acodec', //audio codec
                'libmp3lame',//external encoding library
                '-f', //format
                'mp3',//mp3
                '-'//output to stdout
            ])
            .on('error',(err)=>next(err))
            .on('exit',(code)=>console.log(`Ffmpeg exited with code ${code}`));

            /*Catching Errors on stdin */
            ffplay_child.stdin.on('error',(err)=>next(err));

            /* Setting output pipe first so that we dont lose any bits */
            ffplay_child.stdout.pipe(res).on('error',(err)=>next(err));

            /* For Downloading video from youtube using video-id */
            const ytdl = spawn('youtube-dl', [
                '-o',//output
                '-',//stdout
                '-a',//input stream
                '-'//stdin
            ])
            .on('error',(err)=>next(err))
            .on('exit',(code)=>console.log(`Ytdl exited with code ${code}`));
            
            /* Setting output pipe first so that we dont lose any bits */
            ytdl.stdout.pipe(ffplay_child.stdin).on('error',(err)=>next(err));

            /*Catching errors on stdin */
            ytdl.stdin.on('error',(err)=>next(err));

            /* Writing video url to stdin for youtube-dl */
            ytdl.stdin.write(`http://www.youtube.com/watch?v=${vid}`);

            /*Closing the input stream; imp, else it waits */
            ytdl.stdin.end();
            

        } catch (error) {
            next(err);
    }
});

/* Send mp4 download for video_id youtube */
router.get('/download/video/:vid/:name?', (req,res,next)=>{
  let {vid,name} = req.params;
        vid = decodeURIComponent(vid);//video id
            res.redirect(`http://www.9xyoutube.com/watch?v=${vid}`);
});

module.exports = router;

/**
 * 19

Ffmpeg outputs all of its logging data to stderr, 
to leave stdout free for piping the output data to some other program 
or another ffmpeg instance.

When running ffmpeg as an automatic process it's often useful give the option

-loglevel error
which turns it completely mute in a normal scenario and only outputs 
the error data (to stderr), which is normally what you would expect from a command-line program.
 */