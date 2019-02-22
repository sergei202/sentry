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
	type:string,
	stats:any
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
			socket.emit('start', {delay:100});
		}
		if(data.type==='client') {
			socket.emit('sensors', sensors);
		}
	});

	socket.on('frame', (frame,ack) => {
		var conn = getConnectionFromSocket(socket);
		socket.volatile.in('client').emit('frame', {...frame, conn});

		if(!conn.stats.avgMotion) conn.stats.avgMotion = 0;
		conn.stats.avgMotion = (conn.stats.avgMotion+frame.motion)/2;

		if(frame.motion>=0.1) {
			conn.stats.skip = 0;
			socket.emit('skip', conn.stats.skip);

			onCameraMotion(conn,frame);
		} else {
			if(conn.stats.skip<10 && conn.stats.avgMotion<0.05) {
				conn.stats.skip = 10;
				socket.emit('skip', conn.stats.skip);
				console.log('avgMotion=%j, setting skip=%j', conn.stats.avgMotion, conn.stats.skip);
			}
		}
		if(ack) ack();
	});
	socket.on('stats', stats => {
		var conn = getConnectionFromSocket(socket);
		console.log('%j stats: %j', conn.name, stats);
		socket.volatile.in('client').emit('stats', stats);
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
