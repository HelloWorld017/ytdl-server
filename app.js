const Koa = require('koa');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const ytdl = require('ytdl-core');

const app = new Koa();
const config = require('./config.json');
const port = process.env.PORT || '1337';

const mergeDownload = async (v) => {
	const url = `https://youtube.com/watch?v=${v}`;
	const audioPath = path.resolve(__dirname, `${v}.mp4`);

	await new Promise((resolve) => {
		ytdl(url, {
			filter: format => format.container === 'mp4' && !format.encoding
		}).pipe(fs.createWriteStream(audioPath)).on('finish', resolve);
	});

	const info = await ytdl.getInfo(url);

	const stream = ffmpeg()
			.input(ytdl(url, {
				filter: format => format.container === 'mp4' && !format.audioEncoding
			}))
			.videoCodec('copy')
			.input(audioPath)
			.audioCodec('copy')
			.on('error', (err, stdout, stderr) => {
				console.error('Oops', stdout, stderr);
			})
			.on('end', () => fs.unlink(audioPath, (err) => {
				if(err) console.error(err);
			}))
			.toFormat('mp4')
			.outputOptions('-movflags frag_keyframe+empty_moov')
			.pipe()

	return {title: info.title, stream};
};

app
	.use(async ctx => {
		if(typeof ctx.query.key !== 'string' && ctx.query.key !== config.key) {
			ctx.status = 403;
			ctx.body = 'Authorized only :(';
			return;
		}

		if(typeof ctx.query.v !== 'string') {
			ctx.status = 404;
			ctx.body = 'No keys are given.';
			return;
		}

		try {
			const {title, stream} = await mergeDownload(ctx.query.v);
			ctx.body = ctx.res.pipe(stream);
			ctx.type = 'video/mpeg';
			ctx.attachment(`${title}.mp4`);
		} catch(err) {
			ctx.body = `<h1>Oops!</h1><pre>${err.toString()}</pre>`;
			ctx.type = 'text/html';
		}
	})
	.listen(port, () => console.log(`Listening on port ${port}`));
