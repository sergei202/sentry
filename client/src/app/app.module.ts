import { BrowserModule }			from '@angular/platform-browser';
import { NgModule }					from '@angular/core';
import { FormsModule }				from '@angular/forms';
import { SocketIoModule }			from 'ngx-socket-io';

import { AppRoutingModule }			from './app-routing.module';
import { AppComponent }				from './app.component';
import { LoginComponent }			from './login/login.component';
import { CameraListComponent }		from './camera/camera-list/camera-list.component';
import { CameraDetailComponent }	from './camera/camera-detail/camera-detail.component';
import { AuthGuard }				from './auth.guard';

const socketUrl = '/';

@NgModule({
	declarations: [
		AppComponent,
		LoginComponent,
		CameraListComponent,
		CameraDetailComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		AppRoutingModule,
		SocketIoModule.forRoot({
			url: socketUrl,
			options: {}
		})
	],
	providers: [AuthGuard],
	bootstrap: [AppComponent]
})
export class AppModule { }
