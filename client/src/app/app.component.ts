import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	constructor(private socket:Socket) {
		socket.on('connect', () => {
			console.log('Socket connected');
			socket.emit('init', {
				type: 'client'
			});
		});

		socket.on('connections', connections => {
			console.log('connections = %o', connections);
		});
		socket.on('frame', frame => {
			var delay = Date.now() - new Date(frame.date).getTime();
			console.log('frame: %o', {date:frame.date, conn:frame.conn, delay});
			(document.getElementById('image') as any).src = `data:image/jpeg;base64,${frame.image}`;
		});
	}
}
