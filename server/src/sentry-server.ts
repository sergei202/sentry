import * as http			from 'http';
import * as socketIo		from 'socket.io';
import { config }			from './config';
import { connect } from 'tls';

console.log('Sentry Server.');

const server = http.createServer();
const io = socketIo(server);

interface Connection {
	id:string,		// Socket id
	name:string,
	type:string
};

const connections:Connection[] = [];

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
			socket.emit('start', {delay:500});
		}
	});

	socket.on('frame', frame => {
		var conn = getConnectionFromSocket(socket);
		socket.in('client').emit('frame', {...frame, conn});
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