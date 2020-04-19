import * as socketIoClient				from 'socket.io-client';
import * as dhtSensor					from 'node-dht-sensor';
import { config }						from './config';
import { getVersionFromPackageJson }	from './lib/version';

getVersionFromPackageJson().then(version => {
	console.log('Sentry Sensors %s', version);
});

export const socket = socketIoClient(config.url);

dhtSensor.initialize({
	test: {
		fake: {
			temperature: 21,
			humidity: 60
		}
	}
});

var timerHandle;

socket.on('connect', () => {
	console.log('Socket connected');
	socket.emit('init', {type:'sensors', name:config.name});
	start();

});
socket.on('disconnect', () => {
	console.log('Socket disconnected');
	stop();
});


function start() {
	console.log('start()');
	readSensors();
}

function stop() {
	console.log('stop()');
	if(timerHandle) {
		clearTimeout(timerHandle);
		timerHandle = null;
	}
}

async function readSensors() {
	var dht = await readDht();
	if(!dht) {
		timerHandle = setTimeout(readDht, 60000);
		return;
	}

	var sensors = [{
		type: 'dht',
		name: `${config.name} Temperature`,
		value: convertCtoF(dht.temperature)
	},{
		type: 'dht',
		name: `${config.name} Humidity`,
		value: dht.humidity
	}];

	socket.emit('sensors', sensors);
	timerHandle = setTimeout(readSensors, config.delay);
}

function readDht() {
	return dhtSensor.promises.read(22,4).then(result => {
		console.log('dhtSensor: %o', result);
		return result;
	}, err => {
		console.log('dhtSensor error: %o', err);
		return null;
	});
}

function convertCtoF(c:number) {
	return 32 + c*9/5;
}


// const rl = readline.createInterface({input:process.stdin});
// rl.on('line', (input) => {
// 	var event = JSON.parse(input);
// 	onSensorEvent(event);
// });

// const sensors = [{
// 	id: 161541,
// 	name: 'Front Door Sensor',
// 	type: 'door',
// 	value: false,
// 	decode: event => {
// 		return event.state==='open';
// 	}
// },{
// 	id: 684415,
// 	name: 'Back Door Sensor',
// 	type: 'door',
// 	value: false,
// 	decode: event => {
// 		return event.event===160;
// 	}
// },{
// 	id: 527353,
// 	name: 'Front Door Motion',
// 	type: 'motion',
// 	value: false,
// 	decode: event => {
// 		return event.event===128;
// 	}
// }];

// function onSensorEvent(event) {
// 	console.log('onSensorEvent: %j', event);
// 	var sensor = sensors.find(s => s.id===event.id);
// 	if(!sensor) {
// 		console.log('Failed to find sensor for %j', event.id);
// 		return;
// 	}
// 	var value = sensor.decode(event);
// 	if(value!==sensor.value) {
// 		sensor.value = value;
// 		onSensorChange(sensor);
// 	}

// }


// function prepSensorToSend(sensor) {
// 	var obj = {...sensor};
// 	delete obj.decode;
// 	return obj;
// }

// socket.on('connect', () => {
// 	console.log('Socket connected');
// 	socket.emit('init', {type:'sensors', name:config.name});
// 	socket.emit('sensors', sensors.map(prepSensorToSend));

// });
// socket.on('disconnect', () => {
// 	console.log('Socket disconnected');
// });

// function onSensorChange(sensor) {
// 	console.log('onSensorChange: %j', sensor);
// 	socket.emit('sensor', prepSensorToSend(sensor));
// }
