import * as socketIoClient			from 'socket.io-client';
import * as cv						from 'opencv4nodejs';
import { config }					from './config';

export const socket = socketIoClient(config.url);


socket.on('connect', () => {
	console.log('Socket connected');
	socket.emit('init', {type:'camera', name:config.name});
});
socket.on('disconnect', () => {
	console.log('Socket disconnected');
});

console.log('Sentry Camera.');

const video = new cv.VideoCapture(0);
setInterval(() => {
	var frame = video.read();
	var image = cv.imencode('.jpg', frame).toString('base64');
	socket.emit('image', image);
}, 500);
