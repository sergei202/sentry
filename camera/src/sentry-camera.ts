import * as socketIoClient			from 'socket.io-client';
import * as cv						from 'opencv4nodejs';
import { config }					from './config';

export const socket = socketIoClient(config.url);

var timerHandle;

const video = new cv.VideoCapture(0);
video.set(cv.CAP_PROP_FRAME_WIDTH, 1280);
video.set(cv.CAP_PROP_FRAME_HEIGHT, 768);

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
var delay = 500;

function sendFrame() {
	var frame = video.read();
	if(!frame) {
		if(delay) timerHandle=setTimeout(sendFrame, delay);
		return;
	}
	var image = cv.imencode('.jpg', frame).toString('base64');
	var date = new Date();
	console.log('%s: Sending image', date.toLocaleString());
	var startTime = Date.now();
	socket.emit('frame', {image, date}, confirm => {
		console.log('\tdelay: %j', Date.now()-startTime);
		if(delay) timerHandle=setTimeout(sendFrame, delay);
	});
}

function start(d) {
	delay = d;
	sendFrame();
}

function stop() {
	if(timerHandle) {
		clearTimeout(timerHandle);
		timerHandle = null;
		delay = 0;
		// video.release();
	}
}

console.log('Sentry Camera.');



