import { BrowserModule }		from '@angular/platform-browser';
import { NgModule }				from '@angular/core';
import { SocketIoModule }		from 'ngx-socket-io';

import { AppRoutingModule }		from './app-routing.module';
import { AppComponent }			from './app.component';

const socketUrl = 'http://localhost:7000';

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		SocketIoModule.forRoot({
			url: socketUrl,
			options: {}
		})
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
