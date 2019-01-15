import * as socketIoClient			from 'socket.io-client';
import * as cv						from 'opencv4nodejs';
import { config }					from './config';

export const socket = socketIoClient(config.url);

var timerHandle;

const video = new cv.VideoCapture(0);
video.set(cv.CAP_PROP_FRAME_WIDTH, 1024);
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

function start(delay) {
	timerHandle = setInterval(() => {
		var frame = video.read();
		if(!frame) return;
		var image = cv.imencode('.jpg', frame).toString('base64');
		var date = new Date();
		console.log('%s: Sending image', date.toLocaleString());
		socket.emit('frame', {image, date});
	}, delay || 500);
}

function stop() {
	if(timerHandle) {
		clearInterval(timerHandle);
		timerHandle = null;
		// video.release();
	}
}

console.log('Sentry Camera.');



