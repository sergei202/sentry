import * as http			from 'http';
import * as socketIo		from 'socket.io';
import { config }			from './config';

console.log('Sentry Server.');

const server = http.createServer();
const io = socketIo(server);

const connections = [];

io.on('connection', socket => {
	console.log('New connection: %j', socket.client.conn.remoteAddress);

	socket.on('init', data => {
		console.log('Init: %j', data);
		connections.push({
			... data,
			socketId: socket.id
		});
		socket.join(data.type);
		io.emit('connections', connections);
	});

	socket.on('image', image => {
		socket.in('client').emit('image', image);
	});

	socket.on('disconnect', () => {
		console.log('Disconnected: %j', socket.client.conn.remoteAddress);
		connections.splice(connections.indexOf(socket.id),1);
		io.emit('connections', connections);
	});
});

server.listen(config.port);
