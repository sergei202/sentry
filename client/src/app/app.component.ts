import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	connections = [];

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
		});
		socket.on('frame', frame => {
			var delay = Date.now() - new Date(frame.date).getTime();
			console.log('frame: %o', {date:frame.date, conn:frame.conn, delay});
			(document.getElementById('image') as any).src = `data:image/jpeg;base64,${frame.image}`;
		});
	}
}
