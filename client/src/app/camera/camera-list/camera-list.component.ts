import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
	selector: 'app-camera-list',
	templateUrl: './camera-list.component.html',
	styleUrls: ['./camera-list.component.scss']
})
export class CameraListComponent {
	connections = [];
	cameras = [];
	selected = null;
	sensors = [];

	constructor(private socket:Socket, private domSanitizer:DomSanitizer) {
		socket.on('connect', () => {
			console.log('Socket connected');
			socket.emit('init', {
				type: 'client',
				name: 'Unknown'
			});
		});
		socket.on('disconnect', () => {
			console.log('Socket disconnected');
			this.selected = null;
		});

		socket.on('connections', conns => {
			console.log('connections = %o', conns);
			this.connections = conns;
			this.cameras = conns.filter(c => c.type==='camera');
			if(this.cameras.indexOf(this.selected)===-1) this.selected = null;
		});
		socket.on('frame', frame => {
			// console.log('frame: %o', frame);
			// var delay = Date.now() - new Date(frame.date).getTime();
			var camera = this.cameras.find(c => c.id===frame.conn.id);
			if(camera) {
				var blob = new Blob([frame.image], {type:'image/jpeg'});
				camera.src = this.domSanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob));
				camera.stats = frame.stats;
			}
		});

		// socket.on('sensors', sensors => {
		// 	this.sensors = sensors;
		// 	console.log('sensors: %o', sensors);
		// });
		// socket.on('sensor', sensor => {
		// 	console.log('sensor: %o', sensor);
		// });
	}

	selectCamera(camera) {
		if(this.selected===camera) camera=null;
		this.selected = camera;
	}

	sensorValueLabel(sensor) {
		switch(sensor.type) {
			case 'door':
				return sensor.value ? 'Open':'Closed';
			case 'motion':
				return sensor.value ? 'MOTION':'Still';
			default:
				return sensor.value;
		}
	}
}
