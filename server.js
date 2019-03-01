const Koa = require('koa');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const {inspect} = require('util');
const path = require('path');
const ytdl = require('ytdl-core');

const app = new Koa();
const config = require('./config.json');
const port = process.env.PORT || '1337';

const sanitize = (replacement='') => name => [
	/[\/\?<>\\:\*\|":]/g,
	/[\x00-\x1f\x80-\x9f]/g,
	/^\.+$/,
	/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i,
	/[\. ]+$/
].reduce((prev, curr) => prev.replace(curr, replacement), name).slice(0, 255);
const sanitizeTo_ = sanitize('_');

const fastItags = ['22', '43', '18'];

const findAffordableAudio = formats => {
	formats = formats.filter(v => v.audioBitrate);
	
	const hasFastTags = formats.filter(v => {
		if(fastItags.includes(formats.itag)) {
			return true;
		}
		return false;
	});
	
	if(hasFastTags) {
		return hasFastTags.sort((a, b) => fastItags.indexOf(a.itag) - fastItags.indexOf(b.itag))[0];
	}
	
	return formats.sort((a, b) => b.audioBitrate - a.audioBitrate)[0];
};

const downloadVideo = async (v) => {
	const url = `https://youtube.com/watch?v=${v}`;
	const audioPath = path.resolve(__dirname, 'temp', `${v}.ogg`);
	const {title, formats} = await ytdl.getInfo(url);
	console.log(`Downloading ${title}`);
	
	await new Promise((resolve) => {
		ytdl(url, {
			format: findAffordableAudio(formats)
		}).pipe(fs.createWriteStream(audioPath)).on('finish', resolve);
	});

	const stream = ffmpeg()
			.input(ytdl(url, {
				filter: format => (format.container === 'mp4') && !format.audioBitrate
			}))
			.videoCodec('copy')
			.input(audioPath)
			.audioCodec('aac')
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
	const {title, formats} = await ytdl.getInfo(url);
	console.log(`Downloading ${title}`);
	
	const stream = ffmpeg()
		.input(ytdl(url, {
			format: findAffordableAudio(formats)
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
			if(usage[key].count > config.permission[key].max) {
				ctx.body = "Exceeded :(";
				return;
			}

			usage[key].count++;
		}

		if(typeof ctx.query.v !== 'string') {
			ctx.body = 'No keys are given.';
			return;
		}

		try {
			let title, stream;
			
			if(typeof ctx.query.type === 'string' && ctx.query.type === 'music') {
				({title, stream} = await downloadMusic(ctx.query.v));
				ctx.type = 'audio/mpeg';
				ctx.attachment(sanitizeTo_(`${title}.mp3`));
			} else {
				({title, stream} = await downloadVideo(ctx.query.v));
				ctx.type = 'video/mpeg';
				ctx.attachment(sanitizeTo_(`${title}.mp4`));
			}
	
			ctx.body = stream;
		} catch(err) {
			ctx.type = 'text/html';
			ctx.body = `<h1>Oops!</h1><pre>${inspect(err)}</pre>`;
		}
	})
	.listen(port, () => console.log(`Listening on port ${port}`));
