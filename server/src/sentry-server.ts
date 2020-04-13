import * as http					from 'http';
import * as socketIo				from 'socket.io';
import { config }					from './config';
import { getVersionFromPackageJson}	from './lib/version';
import { onCameraMotion }			from './ctrls/notifyCtrl';
import * as fs						from 'fs';

getVersionFromPackageJson().then(version => {
	console.log('Sentry Server %s', version);
});

const server = http.createServer();
const io = socketIo(server);

interface Connection {
	id:string,		// Socket id
	name:string,
	type:string,
	email:boolean
};

const connections:Connection[] = [];
var sensors:any[] = [];

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
		var conn = getConnectionFromSocket(socket);
		console.log('config: %j', config);
	});

	socket.on('frame', (frame,ack) => {
		var conn = getConnectionFromSocket(socket);
		socket.volatile.in('client').emit('frame', {...frame, conn});

		// console.log('%s: %j', conn.name, frame.stats);

		if(frame.stats.avgMotion>=0.03 && frame.stats.delay!==500) {
			socket.emit('delay', 500);

			if(false) {
				var isoDate = new Date().toISOString();
				saveImage(`images/${isoDate}.jpg`, frame.image);
			}

			// onCameraMotion(conn,frame);
		} else {
			if(frame.stats.avgMotion<0.03 && frame.stats.avgMotion>=0.005 && frame.stats.delay!==1000) {
				socket.emit('delay', 1000);
				// console.log('avgMotion=%j, setting skip=10', frame.stats.avgMotion);
			} else if(frame.stats.avgMotion<0.005 && frame.stats.delay!==2000) {
				socket.emit('delay', 2000);
			}
		}
		if(ack) ack();
	});

	socket.on('sensors', sens => {
		socket.volatile.in('client').emit('sensors', sens);
		sensors = sens;
		console.log('sensors: %j', sensors);
	});
	socket.on('sensor', sensor => {
		socket.volatile.in('client').emit('sensor', sensor);
		sensor.date = new Date();
		console.log('sensor: %j', sensor);
	});

	socket.on('disconnect', () => {
		var conn = getConnectionFromSocket(socket);
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
		var user = config.users.find(u => u.username===creds.username);
		if(!user) return socket.emit('user.login.error', {message:'User not found.'});
		if(user.password!==creds.password) return socket.emit('user.login.error', {message:'Incorrect password.'});

		socket['user'] = user;
		socket.emit('user.login.result', user);
		socket.emit('user.changed', user);


	});

	socket.on('user.check', () => {
		socket.emit('user.check.result', socket['user']);
	});
});

server.listen(config.port);

function getConnectionFromSocket(socket:socketIo.Socket):Connection {
	return connections.find(c => c.id===socket.id);
}

function saveImage(path:string, image:Buffer) {
	return new Promise((resolve,reject) => {
		fs.writeFile(path,image, (err) => {
			if(err) return reject(err);
			resolve(true);
		});
	});
}