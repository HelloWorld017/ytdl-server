const Koa = require('koa');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const {inspect, promisify} = require('util');
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
	
	console.log("Audio finished");

	const stream = ffmpeg()
			.input(ytdl(url, {
				filter: format => (format.container === 'mp4') && !format.audioBitrate
			}))
			.videoCodec('copy')
			.input(audioPath)
			.audioCodec('aac')
			.on('error', (err, stdout, stderr) => {
				console.error('Oops', err, stdout, stderr);
			}).on('progress', progress => {
				process.stdout.cursorTo(0);
				process.stdout.clearLine(1);
				process.stdout.write(progress.timemark);
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

const downloadInfoPath = path.join(__dirname, 'downloads', 'downloads.json');
const downloadQueue = [];
const downloadDaemon = async () => {
	if(downloadQueue.length === 0) {
		setTimeout(downloadDaemon, 3000);
		return;
	}
	
	const {type, v: videoId} = downloadQueue.pop();
	
	const downloads = JSON.parse(await promisify(fs.readFile)(downloadInfoPath, 'utf8'));
	if (downloads.includes(videoId)) return;
	
	downloads.push(videoId);
	await promisify(fs.writeFile)(downloadInfoPath, JSON.stringify(downloads))
	
	let title, stream;
	
	if (type === 'video') {
		({title, stream} = await downloadVideo(videoId));
	} else {
		({title, stream} = await downloadMusic(videoId));
	}
	
	await new Promise(resolve => {
		stream.pipe(fs.createWriteStream(
			path.join(__dirname, 'downloads', sanitizeTo_(`${title}.mp4`))
		)).on('finish', () => {
			resolve();
		});
	});
	
	setTimeout(downloadDaemon);
};

downloadDaemon();

app
	.use(async ctx => {
		if(typeof ctx.query.key !== 'string' && ctx.query.key !== config.key) {
			ctx.body = 'Authorized only :(';
			return;
		}

		if(typeof ctx.query.v !== 'string') {
			ctx.body = 'No keys are given.';
			return;
		}

		try {
			let title, stream;
			downloadQueue.push({
				v: ctx.query.v,
				type: ctx.query.type || 'video'
			});

			ctx.body = 'Done!';
		} catch(err) {
			ctx.body = `<h1>Oops!</h1><pre>${inspect(err)}</pre>`;
			ctx.type = 'text/html';
		}
	})
	.listen(port, () => console.log(`Listening on port ${port}`));
