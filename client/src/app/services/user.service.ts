import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	user:any;
	redirect:string;

	constructor(public socket:Socket) {
		console.log('AuthGuard()');
		this.socket.on('user.changed', d => this.onUserChanged(d));
	}

	onUserChanged(user) {
		console.log('UserService.onUserChanged: %o', user);
		this.user = user;
	}
}
