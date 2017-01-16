'use strict';

const PORT = 8080;

const express = require('express');
const     app = express();
const  server = require('http').Server(app);
const      io = require('socket.io')(server);

const  Camera = require('./camera');

server.listen(PORT, err => {
	console.log('Sentry.  Listening on %j', PORT);
});
app.use(express.static('./public'));
app.use('/bower_components', express.static('./bower_components'));


const camera = new Camera({width:640, height:480});

io.on('connection', socket => {
	console.log('New socket connection');
	socket.emit('message', 'Camera ready');

	socket.on('start', () => camera.start());
	socket.on('stop', () => camera.stop());
	camera.start();

	camera.onFrame(function(err,image,done) {
// 		console.log('sending frame to socket');
// 		socket.emit('output', 'sending frame');
		if(err) return socket.emit('message', {error:'camera.onFrame()', err:err});
		socket.emit('frame', {buffer:image.toBuffer()}, done);
	});
});
