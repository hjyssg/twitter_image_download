const express = require('express');
const os = require('os');

const pfs = require('promise-fs');
const app = express();

//point to img
app.use(express.static('dist'));

app.get('/api/getImg', (req, res) => {
	// res.send({ username: os.userInfo().username })
	// let thumbnail_pathes = await pfs.readdir(thumbnailFolderPath);
});

app.listen(process.env.PORT || 8080, 
	() => console.log(`Listening on port ${process.env.PORT || 8080}!`));
