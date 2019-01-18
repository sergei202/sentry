import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	connections = [];
	cameras = [];
	selected = null;

	constructor(private socket:Socket) {
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
			// var delay = Date.now() - new Date(frame.date).getTime();
			var camera = this.cameras.find(c => c.id===frame.conn.id);
			if(camera) {
				camera.src = `data:image/jpeg;base64,${frame.image}`;
			}
			// console.log('frame: %o', {date:frame.date, conn:frame.conn, delay});
		});
	}

	selectCamera(camera) {
		if(this.selected===camera) camera=null;
		this.selected = camera;
	}
}
