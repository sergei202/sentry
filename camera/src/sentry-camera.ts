import * as socketIoClient				from 'socket.io-client';
import * as cv							from 'opencv4nodejs';
import { config }						from './config';
import { getVersionFromPackageJson }	from './lib/version';
import { detectMotion }					from './motion';
import { statSync } from 'fs';

getVersionFromPackageJson().then(version => {
	console.log('Sentry Camera %s', version);
});

export const socket = socketIoClient(config.url);

const video = new cv.VideoCapture(config.device || 0);
if(config.width)  video.set(cv.CAP_PROP_FRAME_WIDTH,  config.width);
if(config.height) video.set(cv.CAP_PROP_FRAME_HEIGHT, config.height);

var timerHandle;
const stats = {
	delay: 500,
	skip: 10,
	processed: 0,
	sent: 0,
	rtt: 0,
	uptime: 0,
	motion: 0,
	avgMotion: 0
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
	start(params.delay || 500);
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


function processFrame() {
	var frame = video.read();
	if(!frame) {
		if(stats.delay) timerHandle=setTimeout(sendFrame, stats.delay);
		return;
	}
	stats.motion = detectMotion(frame);
	stats.avgMotion = (stats.motion+stats.avgMotion)/2;

	var image = cv.imencode('.jpg', frame).toString('base64');
	stats.processed++;

	if(!stats.skip || stats.processed%stats.skip===0) sendFrame(image);

	if(stats.delay) timerHandle=setTimeout(processFrame, stats.delay);
}


function sendFrame(image) {
	var date = new Date();
	stats.uptime = process.uptime();
	socket.emit('frame', {image,date,stats}, () => {
		var rtt = Date.now()-date.getTime();
		stats.rtt = (stats.rtt+rtt)/2
		stats.sent++;
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
