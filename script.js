const express = require('express');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const dotenv = require('dotenv');

dotenv.config();

const httpsServer = https.createServer(app);

app.get('/', async (req, res) => {
    const answer = req.query.answer || 'test';
    console.log('answer', answer);
    const request = await fetch('https://play.ht/api/v2/tts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PLAYHT_TOKEN}`,
            'X-User-Id': process.env.PLAYHT_USER_ID
        },
        body: JSON.stringify({
            "text": answer,
            "voice": "s3://voice-cloning-zero-shot/86cc02af-4340-4b54-8fcb-6a870b6c9bd2/toly/manifest.json",
        })
    });
    const response = await request.text();
    const regex = /"url":"(https:\/\/[^\"]+)"/;
    const match = response.match(regex);
    var url;
    if (match && match[1]) {
        url = match[1];
        console.log('Extracted URL:', url);
    } else {
        console.log('URL not found');
    }

    const filePath = `./${Date.now()}.mp3`;
    const outputFilePath = `./answer-${Date.now()}.mp4`;
    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                exec(
                    `ffmpeg -i heytoly.mp4 -i ${filePath} -c:v copy -c:a aac -strict experimental -map 0:v:0 -map 1:a:0 ${outputFilePath}`,
                    (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error: ${error.message}`);
                            res.status(500).json({ error: error.message });
                            return;
                        }
                        if (stderr) {
                            console.warn(`ffmpeg stderr:\n${stderr}`);
                        }
                        console.log(`Command output:\n${stdout}`);

                        // Set the headers for file download
                        res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(outputFilePath));
                        res.setHeader('Content-Type', 'video/mp4');

                        // Send the generated .mp4 file back to the client
                        res.sendFile(path.resolve(outputFilePath));
                    }
                );
            });
        });
    }).on('error', (err) => {
        fs.unlink(filePath); // Delete the file on error
        console.error(`File download error: ${err.message}`);
        res.status(500).json({ error: err.message });
    });
});

app.listen(3000, () => console.log('App is listening'));

// httpsServer.listen(443, () => {
//     console.log('HTTPS Server running on port 443');
// });
