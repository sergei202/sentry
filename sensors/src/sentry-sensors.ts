import * as readline					from 'readline';
import * as socketIoClient				from 'socket.io-client';
import { config }						from './config';
import { getVersionFromPackageJson }	from './lib/version';

getVersionFromPackageJson().then(version => {
	console.log('Sentry Sensors %s', version);
});

export const socket = socketIoClient(config.url);


const rl = readline.createInterface({input:process.stdin});
rl.on('line', (input) => {
	var event = JSON.parse(input);
	onSensorEvent(event);
});

const sensors = [{
	id: 527353,
	name: 'Front Door Motion',
	value: false,
	decode: event => {
		return event.event===128;
	}
},{
	id: 684415,
	name: 'Back Door Sensor',
	value: false,
	decode: event => {
		return event.event===160;
	}
},{
	id: 161541,
	name: 'Front Door Sensor',
	value: false,
	decode: event => {
		return event.state==='open';
	}
}];

function onSensorEvent(event) {
	console.log('onSensorEvent: %j', event);
	var sensor = sensors.find(s => s.id===event.id);
	if(!sensor) {
		console.log('Failed to find sensor for %j', event.id);
		return;
	}
	var value = sensor.decode(event);
	if(value!==sensor.value) {
		sensor.value = value;
		onSensorChange(sensor);
	}

}


function prepSensorToSend(sensor) {
	var obj = {...sensor};
	delete obj.decode;
	return obj;
}

socket.on('connect', () => {
	console.log('Socket connected');
	socket.emit('init', {type:'sensors', name:config.name});
	socket.emit('sensors', sensors.map(prepSensorToSend));

});
socket.on('disconnect', () => {
	console.log('Socket disconnected');
});

function onSensorChange(sensor) {
	console.log('onSensorChange: %j', sensor);
	socket.emit('sensor', prepSensorToSend(sensor));
}
