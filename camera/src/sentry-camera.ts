import * as socketIoClient				from 'socket.io-client';
import * as cv							from 'opencv4nodejs';
import * as mic							from 'mic';
import * as moment						from 'moment';
import * as fs							from 'fs';
import { config }						from './config';
import { getVersionFromPackageJson }	from './lib/version';
import { detectMotion }					from './motion';

const stats = {
	version: '',
	delay: 100,
	skip: 0,
	processed: 0,
	sent: 0,
	rtt: 0,
	uptime: 0,
	motion: 0,
	avgMotion: 0,

	// processFrameCount: 0,
	// processFrameRate: 0,

	// sendFrameCount: 0,
	// sendFrameRate: 0
};

getVersionFromPackageJson().then(version => {
	console.log('Sentry Camera %s', version);
	stats.version = version;
});

export const socket = socketIoClient(config.url);

const video = new cv.VideoCapture(config.device || 0);
if(config.width)  video.set(cv.CAP_PROP_FRAME_WIDTH,  config.width);
if(config.height) video.set(cv.CAP_PROP_FRAME_HEIGHT, config.height);

var timerHandle;

socket.on('connect', () => {
	console.log('Socket connected');
	socket.emit('init', {type:'camera', name:config.name, stats});
});
socket.on('disconnect', () => {
	console.log('Socket disconnected');
	stop();
});

socket.on('start', params => {
	start();
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

// var fpsTime = 1;
// function calcProcessFrameRate() {
// 	var fps = (stats.processed - stats.processFrameCount)/fpsTime;
// 	stats.processFrameCount = stats.processed;
// 	stats.processFrameRate = fpsTime;
// 	console.log('calcProcessFrameRate:\tfps=%o,\tstats.processed=%o,\tprocessFrameCount=%o,\tdelay=%o', fps, stats.processed, stats.processFrameCount, stats.delay);
// 	setTimeout(() => calcProcessFrameRate(), fpsTime*1000);
// }
// function calcSendFrameRate() {
// 	var fps = (stats.sent - stats.sendFrameCount)/fpsTime;
// 	stats.sendFrameCount = stats.sent;
// 	stats.sendFrameRate = fpsTime;
// 	console.log('calcSendFrameRate:\tfps=%o,\tstats.sent=%o,\t\tsendFrameCount=%o,\tskip=%o', fps, stats.sent, stats.sendFrameCount, stats.skip);
// 	setTimeout(() => calcSendFrameRate(), fpsTime*1000);
// }

// calcProcessFrameRate();
// calcSendFrameRate();

async function processFrame() {
	// console.log('processFrame()');
	// console.time('video.readAsync');
	try {
		var frame = await video.readAsync();
		// console.timeEnd('video.readAsync');
		if(!frame) {
			timerHandle = setTimeout(processFrame, stats.delay);
			return;
		}

		if(config.detectMotion) {
			stats.motion = detectMotion(frame);
			stats.avgMotion = (stats.motion+stats.avgMotion)/2;
		}

		var date = new Date().toLocaleString();
		frame.putText(date, new cv.Point2(0,20), 0, 0.5, new cv.Vec3(255,0,0), 0);
		stats.processed++;

		var image = cv.imencode('.jpg', frame);
		// if(stats.avgMotion>0.1 && stats.processed%10===0) {
		// 	var isoDate = new Date().toISOString();
		// 	saveImage(`images/${isoDate}.jpg`, image);
		// }

		if(!stats.skip || stats.processed%stats.skip===0) {
			sendFrame(image);
		}

		timerHandle = setTimeout(processFrame, stats.delay);
	}
	catch(err) {
		console.log('processFrame() Caught error: %o', err.stack || err);
		timerHandle = setTimeout(processFrame, stats.delay*10);
	}
}


function sendFrame(image:Buffer) {
	// console.log('sendFrame()');
	var date = new Date();
	stats.uptime = process.uptime();
	// stats.load = process.load
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


const micInstance = mic({ // arecord -D hw:0,0 -f S16_LE -r 44100 -c 2
	// device: 'hw:0,0',           //   -D hw:0,0
	encoding: 'signed-integer', //             -f S
	bitwidth: '16',             //                 16
	endian: 'little',           //                   _LE
	rate: '44100',              //                       -r 44100
	channels: '1',              //                                -c 2
	debug: false
})
const micInputStream = micInstance.getAudioStream();
micInstance.start();


function start() {
	processFrame();
	micInstance.resume();
}

function stop() {
	if(timerHandle) {
		clearTimeout(timerHandle);
		timerHandle = null;
	}
	micInstance.pause();
}










micInputStream.on('data', data => {
	// console.log('Recieved Input Stream: %o', data.length);
	getSoundVolume(data);
	socket.emit('mic', data);
});
micInputStream.on('error', err => {
	console.log("Error in Input Stream: " + err)
});



function getSoundVolume(chunk) {
	var sample = 0;
	var maxVolume = 0;
	for(var i=0; i<chunk.length; i=i+2) {
		if(chunk[i+1] > 128) {
			sample = (chunk[i+1] - 256) * 256;
		} else {
			sample = chunk[i+1] * 256;
		}
		sample += chunk[i];

		var volume = Math.abs(sample)/32768;
		if(volume>maxVolume) maxVolume=volume;
	}
	if(maxVolume>1) maxVolume = 1;
	if(maxVolume>0.5) console.log('volume: %o', maxVolume);
	return maxVolume;
}



