import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	constructor(private socket:Socket) {
		socket.emit('init', {
			type: 'client'
		});
		socket.on('connections', connections => {
			console.log('connections = %o', connections);
		});
		socket.on('image', image => {
			(document.getElementById('image') as any).src = `data:image/jpeg;base64,${image}`;
		});
	}
}
