'use strict';

var image = new Image();
var canvas, ctx;

var rateInterval = null;
var frames = 0;

$(document).ready(function() {
	const socket = io.connect('/');
	socket.on('message', data => {
		console.log(data);
	});

	canvas = document.getElementById('camera');
	ctx = canvas.getContext('2d');

	socket.on('frame', (data,done) => {
		// console.log('socket frame');
		drawImage(ctx,data.buffer,done);
		if(!rateInterval) {
			rateInterval = setInterval(calcFrameRate, 1000);
		}
	});

	$('.btn.start').on('click', () => {
		socket.emit('start');
	});
	$('.btn.stop').on('click', () => {
		socket.emit('stop');
		if(rateInterval) {
			clearInterval(rateInterval);
			rateInterval = null;
		}
	});
});

function calcFrameRate() {
	console.log('calcFrameRate: fps: %o', frames);
	frames = 0;
}


function drawImage(ctx, buffer, done) {
	// Reference: http://stackoverflow.com/questions/24107378/socket-io-began-to-support-binary-stream-from-1-0-is-there-a-complete-example-e/24124966#24124966
	var uint8Arr = new Uint8Array(buffer);
	var str = String.fromCharCode.apply(null, uint8Arr);
	var base64String = btoa(str);
	// console.log('drawImage: length=%o', base64String.length);
	image.onload = function() {
		ctx.drawImage(this, 0,0, canvas.width, canvas.height);
		frames++;
		if(done) done();
	};
	image.src = 'data:image/png;base64,' + base64String;
}
