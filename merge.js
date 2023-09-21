const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Set the FFmpeg path for fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

function mergeVideoAndAudio(videoPath, audioPath, outputPath) {
    ffmpeg()
        .input(videoPath)
        .videoCodec('copy')
        .input(audioPath)
        .audioCodec('aac')
        // .map('0:v:0')
        .on('end', () => {
            console.log('Merging finished !');
        })
        .on('error', (err) => {
            console.error('Error:', err);
        })
        .save(outputPath);
}

// Paths for the video, audio, and output files
const videoPath = 'heytoly-noaudio.mp4';
const audioPath = 'test.mp3';
const outputPath = `output.mp4`;

// Merge the video and audio
mergeVideoAndAudio(videoPath, audioPath, outputPath);
