import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	connections = [];
	cameras = [];
	selected = null;
	sensors = [];

	constructor(private socket:Socket, private domSanitizer:DomSanitizer) {
		socket.on('connect', () => {
			console.log('Socket connected');
			socket.emit('init', {
				type: 'client'
			});
		});

		socket.on('connections', conns => {
			console.log('connections = %o', conns);
			this.connections = conns;
			this.cameras = conns.filter(c => c.type==='camera');
		});
		socket.on('frame', frame => {
			console.log('frame: %o', frame);
			// var delay = Date.now() - new Date(frame.date).getTime();
			var camera = this.cameras.find(c => c.id===frame.conn.id);
			if(camera) {
				var blob = new Blob([frame.image], {type:'image/jpeg'});
				camera.src = this.domSanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob));
				camera.stats = frame.stats;
			}
		});

		socket.on('sensors', sensors => {
			this.sensors = sensors;
			console.log('sensors: %o', sensors);
		});
		socket.on('sensor', sensor => {
			console.log('sensor: %o', sensor);
		});
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
