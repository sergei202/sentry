import * as http					from 'http';
import * as socketIo				from 'socket.io';
import * as path					from 'path';
import { config }					from './config';
import { getVersionFromPackageJson}	from './lib/version';
import { onCameraMotion }			from './ctrls/notifyCtrl';
import * as fs						from 'fs';


console.log('Sentry Server %s', getVersionFromPackageJson());


const server = http.createServer();
const io = socketIo(server);

interface Connection {
	id:string,		// Socket id
	name:string,
	type:string,
	email:boolean
};

const connections:Connection[] = [];
const sensors:any[] = [];

io.on('connection', socket => {
	console.log('New connection: %j', socket.id);

	socket.on('init', data => {
		console.log('init: %j', data);
		connections.push({
			...data,
			id: socket.id
		});
		socket.join(data.type);
		io.emit('connections', connections);
		console.log('connections: %j', connections.length);
		if(data.type==='camera') {
			socket.emit('start');
			socket.emit('delay', 500);
		}
		if(data.type==='client') {
			// socket.emit('sensors', sensors);
		}
	});


	socket.on('config', config => {
		const conn = getConnectionFromSocket(socket);
		console.log('config: %j', config);
	});

	socket.on('frame', (frame,ack) => {
		const conn = getConnectionFromSocket(socket);
		socket.volatile.in('client').emit('frame', {...frame, conn});

		// console.log('%s: %j', conn.name, frame.stats);

		if(frame.stats.avgMotion>=0.1) {
			if(frame.stats.delay!==500) socket.emit('delay', 500);

			if(true) {
				const now = new Date();
				const isoDate = now.toISOString();
				const year = now.getFullYear();
				const month = now.getMonth()+1;
				const day = now.getDate();
				saveImage(`images/${conn.name}/${year}/${month}/${day}/${conn.name}-${isoDate}.jpg`, frame.image);
			}

			// onCameraMotion(conn,frame);
		} else {
			if(frame.stats.avgMotion>=0.01) {
				if(frame.stats.delay!==1000) socket.emit('delay', 1000);
			} else if(frame.stats.avgMotion<0.01) {
				if(frame.stats.delay!==2000) socket.emit('delay', 2000);
			}
		}
		if(ack) ack();
	});

	socket.on('sensors', sensors => {
		socket.volatile.in('client').emit('sensors', sensors);
		sensors = sensors;
		console.log('sensors: %j', sensors);
	});
	socket.on('sensor', sensor => {
		socket.volatile.in('client').emit('sensor', sensor);
		sensor.date = new Date();
		console.log('sensor: %j', sensor);
	});

	socket.on('disconnect', () => {
		const conn = getConnectionFromSocket(socket);
		console.log('Disconnected: %o', conn ? {type:conn.type, name:conn.name, id:conn.id} : socket.id);
		let index = connections.map(c => c.id).indexOf(socket.id);
		if(index!==-1) connections.splice(index,1);
		io.emit('connections', connections);
		console.log('connections: %j', connections.length);
	});


	socket.on('user.login', creds => {
		if(!config.users || !config.users.length) {
			return socket.emit('user.login.error', {message:'No users defined on the server.'});
		}
		const user = config.users.find(u => u.username===creds.username);
		if(!user) return socket.emit('user.login.error', {message:'User not found.'});
		if(user.password!==creds.password) return socket.emit('user.login.error', {message:'Incorrect password.'});

		socket['user'] = user;
		socket.emit('user.login.result', user);
		socket.emit('user.changed', user);
	});
	socket.on('user.check', () => {
		socket.emit('user.check.result', socket['user']);
	});

	socket.on('mic', chunk => {
		const conn = getConnectionFromSocket(socket);
		const volume = getSoundVolume(chunk);
		console.log('mic: %o: %o', conn.name, volume);
		socket.volatile.in('client').emit('mic', {conn,volume,chunk});
	});
});

server.listen(config.port);

function getConnectionFromSocket(socket:socketIo.Socket):Connection {
	return connections.find(c => c.id===socket.id);
}

function saveImage(location:string, image:Buffer) {
	return new Promise(async (resolve,reject) => {
		const parts = location.split(path.sep);
		parts.pop();
		const dir = parts.join(path.sep);
		await createDir(dir);
		fs.writeFile(location,image, (err) => {
			if(err) return reject(err);
			resolve(true);
		});
	});
}

function createDir(dir:string):Promise<string> {
	// console.log('createDir: %j', dir);
	return new Promise<string>((resolve,reject) => {
		fs.stat(dir, (err,stats) => {
			if(!err) return resolve(dir);
			// console.log('fs.stat err: %j', err);
			if(err.code!=='ENOENT') return reject(err);
			fs.mkdir(dir, (err) => {
				if(!err) {
					console.log('createDir: Created %j', dir);
					return resolve(dir);
				}
				if(err.code!=='ENOENT') return reject(err);
				// console.log('fs.mkdir err: %j', err);
				const parts = dir.split(path.sep);
				parts.pop();
				const parentDir = parts.join(path.sep);
				if(!parentDir) return reject(err);
				createDir(parentDir)
					.then(() => createDir(dir))
					.then(resolve)
					.catch(reject);
			});
		});
	});
}

/*
const Speaker = require('speaker');
import * as Stream from 'stream';

const speakerInstance = new Speaker({ // | aplay -D plughw:CARD=0,DEV=0
	channels: 1,
	bitDepth: 16,
	sampleRate: 44100,
	signed: true,
    // device: 'plughw:2,0' //'plughw:NVidia,7'
})
speakerInstance.on('open', () => {
	console.log('speakerInstance opened');
	// micStream.pipe(speakerInstance);
});
speakerInstance.on('error', err => {
	console.log('speakerInstance error: %o', err);
});

class MicStream extends Stream.Readable {
	constructor(options?:any) {
		super(options);
		console.log('MicStream()');
	}

	_read(size:number) {
		console.log('MicStream.read() size=%o', size);
	}
}

const micStream = new MicStream();

// micStream.pipe(process.stdout);

// var count = 0;
// setInterval(() => {
// 	micStream.emit('data',Buffer.from((count++).toString()));
// }, 500);


// micStream.pipe(process.stdout);

micStream.on('data', data => {
	// console.log('micStream data=%o', data);
	var volume = getSoundVolume(data);
	io.emit('volume', volume);
});

console.log('started');

micStream.pipe(speakerInstance);

*/

function getSoundVolume(chunk) {
	let sample = 0;
	let maxVolume = 0;
	for(let i=0; i<chunk.length; i=i+2) {
		if(chunk[i+1] > 128) {
			sample = (chunk[i+1] - 256) * 256;
		} else {
			sample = chunk[i+1] * 256;
		}
		sample += chunk[i];

		let volume = Math.abs(sample)/32768;
		if(volume>maxVolume) maxVolume=volume;
	}
	if(maxVolume>1) maxVolume = 1;
	if(maxVolume>0.5) console.log('volume: %o', maxVolume);
	return maxVolume;
}
