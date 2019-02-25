import * as http					from 'http';
import * as socketIo				from 'socket.io';
import { config }					from './config';
import { getVersionFromPackageJson}	from './lib/version';
import { onCameraMotion }			from './ctrls/notifyCtrl';

getVersionFromPackageJson().then(version => {
	console.log('Sentry Server %s', version);
});


const server = http.createServer();
const io = socketIo(server);

interface Connection {
	id:string,		// Socket id
	name:string,
	type:string
};

const connections:Connection[] = [];
var sensors:any[] = [];

io.on('connection', socket => {
	console.log('New connection: %j', socket.id);

	socket.on('init', data => {
		console.log('Init: %j', data);
		connections.push({
			... data,
			id: socket.id
		});
		socket.join(data.type);
		io.emit('connections', connections);
		console.log('connections: %j', connections.length);
		if(data.type==='camera') {
			socket.emit('start', {delay:250});
		}
		if(data.type==='client') {
			socket.emit('sensors', sensors);
		}
	});

	socket.on('frame', (frame,ack) => {
		var conn = getConnectionFromSocket(socket);
		socket.volatile.in('client').emit('frame', {...frame, conn});

		console.log('%s: %j', conn.name, frame.stats);

		if(frame.stats.motion>=0.1) {
			socket.emit('skip', 0);

			onCameraMotion(conn,frame);
		} else {
			if(frame.stats.skip<10 && frame.stats.avgMotion<0.05) {
				socket.emit('skip', 10);
				console.log('avgMotion=%j, setting skip=10', frame.stats.avgMotion);
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
		console.log('Disconnected: %j', socket.id);
		connections.splice(connections.map(c => c.id).indexOf(socket.id),1);
		io.emit('connections', connections);
		console.log('connections: %j', connections.length);
	});
});

server.listen(config.port);

function getConnectionFromSocket(socket:socketIo.Socket):Connection {
	return connections.find(c => c.id===socket.id);
}
