import * as socketIoClient				from 'socket.io-client';
import * as cv							from 'opencv4nodejs';
import { config }						from './config';
import { getVersionFromPackageJson }	from './lib/version';
import { detectMotion }					from './motion';

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
	uptime: 0
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
	sendStats();
});
socket.on('skip', skip => {
	stats.skip = skip;
	sendStats();
});
socket.on('stats', () => {
	sendStats();
});


function processFrame() {
	var frame = video.read();
	if(!frame) {
		if(stats.delay) timerHandle=setTimeout(sendFrame, stats.delay);
		return;
	}
	var motion = detectMotion(frame);
	var image = cv.imencode('.jpg', frame).toString('base64');
	stats.processed++;

	if(!stats.skip || stats.processed%stats.skip===0) sendFrame(image,motion);

	if(stats.delay) timerHandle=setTimeout(processFrame, stats.delay);
}


function sendFrame(image,motion) {
	var date = new Date();
	var startTime = Date.now();
	socket.emit('frame', {image, motion, date}, confirm => {
		var rtt = Date.now()-startTime;
		if(!stats.rtt) stats.rtt = rtt;
		stats.rtt = (stats.rtt+rtt)/2
		stats.sent++;
		if(stats.sent%100===0) sendStats();
	});
}

function sendStats() {
	stats.uptime = process.uptime();
	console.log('%s: stats=%j', new Date().toLocaleString(), stats);
	socket.emit('stats', stats);
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
