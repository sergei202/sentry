import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CameraListComponent } from './camera/camera-list/camera-list.component';
import { AuthGuard } from './auth.guard';

const routes:Routes = [
	{path:'',					redirectTo:'/cameras', pathMatch:'full'},
	{path:'login',				component:LoginComponent},
	{path:'cameras',			component:CameraListComponent,			canActivate:[AuthGuard]},
	{path:'cameras/:id',		component:CameraListComponent,			canActivate:[AuthGuard]}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
