import { Component, OnInit, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
	creds = {
		username: '',
		password: ''
	};
	busy = false;
	error = '';

	constructor(private socket:Socket, private router:Router, private userService:UserService) { }

	ngOnInit() {
		this.socket.on('user.login.result', d => this.onLoginResult(d));
		this.socket.on('user.login.error',  d => this.onLoginError(d));
	}

	ngOnDestroy() {
		this.socket.removeAllListeners('user.login.result');
		this.socket.removeAllListeners('user.login.error');
	}

	onLoginResult(user) {
		console.log('onLoginResult: %o', user);
		this.busy = false;
		this.userService.user = user;
		this.router.navigate(['/cameras']);

		this.socket.emit('init', {
			type: 'client',
			name: user.name
		});
	}
	onLoginError(err) {
		console.log('onLoginError: %o', err);
		this.error = err.message;
		this.busy = false;
	}

	login() {
		console.log('login: %o', this.creds);
		this.busy = true;
		this.socket.connect();
		this.socket.emit('user.login', this.creds);

	}

}
