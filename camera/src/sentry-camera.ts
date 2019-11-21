import * as socketIoClient				from 'socket.io-client';
import * as cv							from 'opencv4nodejs';
import * as moment						from 'moment';
import * as fs							from 'fs';
import { config }						from './config';
import { getVersionFromPackageJson }	from './lib/version';
import { detectMotion }					from './motion';

getVersionFromPackageJson().then(version => {
	console.log('Sentry Camera %s', version);
	stats.version = version;
});

export const socket = socketIoClient(config.url);

const video = new cv.VideoCapture(config.device || 0);
if(config.width)  video.set(cv.CAP_PROP_FRAME_WIDTH,  config.width);
if(config.height) video.set(cv.CAP_PROP_FRAME_HEIGHT, config.height);

var timerHandle;
const stats = {
	version: '',
	delay: 10,
	skip: 1,
	processed: 0,
	sent: 0,
	rtt: 0,
	uptime: 0,
	motion: 0,
	avgMotion: 0,

	processFrameCount: 0,
	processFrameRate: 0,

	sendFrameCount: 0,
	sendFrameRate: 0
};

socket.on('connect', () => {
	console.log('Socket connected');
	socket.emit('init', {type:'camera', name:config.name, stats});
});
socket.on('disconnect', () => {
	console.log('Socket disconnected');
	stop();
});

socket.on('start', params => {
	start(params.delay || 10);
});
socket.on('stop', () => {
	stop();
});
socket.on('delay', delay => {
	stats.delay = delay;
});
socket.on('skip', skip => {
	stats.skip = skip;
});

var fpsTime = 5;

function calcProcessFrameRate() {
	var fps = (stats.processed - stats.processFrameCount)/fpsTime;
	stats.processFrameCount = stats.processed;
	stats.processFrameRate = fpsTime;
	console.log('calcProcessFrameRate:\tfps=%o,\tstats.processed=%o,\tprocessFrameCount=%o', fps, stats.processed, stats.processFrameCount);
	setTimeout(() => calcProcessFrameRate(), fpsTime*1000);
}
function calcSendFrameRate() {
	var fps = (stats.sent - stats.sendFrameCount)/fpsTime;
	stats.sendFrameCount = stats.sent;
	stats.sendFrameRate = fpsTime;
	console.log('calcSendFrameRate:\tfps=%o,\tstats.sent=%o,\t\tsendFrameCount=%o', fps, stats.sent, stats.sendFrameCount);
	setTimeout(() => calcSendFrameRate(), fpsTime*1000);
}

calcProcessFrameRate();
calcSendFrameRate();

async function processFrame() {
	// console.log('processFrame()');
	// console.time('video.readAsync');
	var frame = await video.readAsync();
	// console.timeEnd('video.readAsync');
	if(!frame) {
		if(stats.delay) timerHandle=setTimeout(processFrame, stats.delay);
		return;
	}

	stats.motion = detectMotion(frame);
	stats.avgMotion = (stats.motion+stats.avgMotion)/2;

	var date = new Date().toLocaleString();
	frame.putText(date, new cv.Point2(0,20), 0, 0.5, new cv.Vec3(255,0,0), 0);
	stats.processed++;

	var image = cv.imencode('.jpg', frame);
	if(stats.avgMotion>0.1 && stats.processed%10===0) {
		var isoDate = new Date().toISOString();
		saveImage(`images/${isoDate}.jpg`, image);
	}

	if(!stats.skip || stats.processed%stats.skip===0) {
		sendFrame(image);
	}


	timerHandle=setTimeout(processFrame, stats.delay);
}


function sendFrame(image:Buffer) {
	// console.log('sendFrame()');
	var date = new Date();
	stats.uptime = process.uptime();
	socket.emit('frame', {image,date,stats}, () => {
		var rtt = Date.now()-date.getTime();
		stats.rtt = (stats.rtt+rtt)/2
		stats.sent++;
	});
}


function saveImage(path:string, image:Buffer) {
	return new Promise((resolve,reject) => {
		fs.writeFile(path,image, (err) => {
			if(err) return reject(err);
			resolve(true);
		});
	});
}


function start(delay) {
	stats.delay = delay;
	processFrame();
}

function stop() {
	if(timerHandle) {
		clearTimeout(timerHandle);
		timerHandle = null;
	}
	stats.delay = 0;
}
