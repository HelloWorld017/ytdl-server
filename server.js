const Koa = require('koa');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const util = require('util');
const ytdl = require('ytdl-core');

const app = new Koa();
const config = require('./config.json');
const port = process.env.PORT || '1337';

const downloadVideo = async (v) => {
	const url = `https://youtube.com/watch?v=${v}`;
	const audioPath = path.resolve(__dirname, `${v}.mp4`);

	await new Promise((resolve) => {
		ytdl(url, {
			filter: format => format.container === 'mp4' && !format.encoding
		}).pipe(fs.createWriteStream(audioPath)).on('finish', resolve);
	});

	const {title} = await ytdl.getInfo(url);

	const stream = ffmpeg()
			.input(ytdl(url, {
				filter: format => format.container === 'mp4' && !format.audioEncoding
			}))
			.videoCodec('copy')
			.input(audioPath)
			.audioCodec('copy')
			.on('error', (err, stdout, stderr) => {
				console.error('Oops', err, stdout, stderr);
			})
			.on('end', () => fs.unlink(audioPath, (err) => {
				if(err) console.error(err);
			}))
			.toFormat('mp4')
			.outputOptions('-movflags frag_keyframe+empty_moov')
			.pipe();

	return {title, stream};
};

const downloadMusic = async (v) => {
	const url = `https://youtube.com/watch?v=${v}`;
	const {title} = await ytdl.getInfo(url);

	const stream = ffmpeg()
		.input(ytdl(url, {
			filter: format => format.container === 'mp4' && !format.encoding
		}))
		.audioCodec('libmp3lame')
		.toFormat('mp3')
		.on('error', (err, stdout, stderr) => {
			console.error('Oops', err, stdout, stderr);
		})
		.pipe();

	return {title, stream};
};

const usage = [];

app
	.use(async ctx => {
		const key = ctx.query.key;

		if(typeof key !== 'string' || !config.key.includes(key)) {
			ctx.body = 'Authorized only :(';
			return;
		}

		if(usage[key] && usage[key].date + 3600*24*1000 < Date.now()) 
			usage[key] = undefined;
		
		if(!usage[key]) usage[key] = {count: 1, date: Date.now()};

		if(config.permission && config.permission[key]) {
			if(usage[key] > config.permission[key].max) {
				ctx.body = "Exceeded :(";
				return;
			}
		}

		if(typeof ctx.query.v !== 'string') {
			ctx.body = 'No keys are given.';
			return;
		}

		console.log(`Downloading ${ctx.query.v}`);

		try {
			let title, stream;

			if(typeof ctx.query.type === 'string' && ctx.query.type === 'music') {
				({title, stream} = await downloadMusic(ctx.query.v));
				ctx.type = 'audio/mpeg';
				ctx.attachment(`${title}.mp3`);
			} else {
				({title, stream} = await downloadVideo(ctx.query.v));
				ctx.type = 'video/mpeg';
				ctx.attachment(`${title}.mp4`);
			}

			ctx.body = ctx.res.pipe(stream);
		} catch(err) {
			ctx.body = `<h1>Oops!</h1><pre>${util.inspect(err)}</pre>`;
			ctx.type = 'text/html';
		}
	})
	.listen(port, () => console.log(`Listening on port ${port}`));
