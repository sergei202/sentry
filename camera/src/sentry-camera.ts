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
const stats:any = {
	delay: 500,
	count: 0,
	rtt: 0
};

socket.on('connect', () => {
	console.log('Socket connected');
	socket.emit('init', {type:'camera', name:config.name});
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
socket.on('stats', () => {
	stats.uptime = process.uptime();
	socket.emit('stats', stats);
});

function sendFrame() {
	var frame = video.read();
	if(!frame) {
		if(stats.delay) timerHandle=setTimeout(sendFrame, stats.delay);
		return;
	}
	var motion = detectMotion(frame);
	var image = cv.imencode('.jpg', frame).toString('base64');

	var date = new Date();
	var startTime = Date.now();
	socket.emit('frame', {image, motion, date}, confirm => {
		stats.count++;
		if(stats.count%100===0) {
			stats.rtt = Date.now()-startTime;
			console.log('%s: Sending image, count=%j,\trtt=%j', date.toLocaleString(), stats.count, stats.rtt);
			stats.uptime = process.uptime();
			socket.emit('stats', stats);
		}
		if(stats.delay) timerHandle=setTimeout(sendFrame, stats.delay);
	});
}

function start(d) {
	stats.delay = d;
	sendFrame();
}

function stop() {
	if(timerHandle) {
		clearTimeout(timerHandle);
		timerHandle = null;
	}
	stats.delay = 0;
}
