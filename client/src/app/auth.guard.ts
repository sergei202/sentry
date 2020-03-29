import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';

// import { UserService } from './services/user.service';
import { ActivatedRouteSnapshot } from '@angular/router';
import { RouterStateSnapshot } from '@angular/router';
import { UserService } from './services/user.service';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
	constructor(private router:Router, private userService:UserService) {
		console.log('AuthGuard()');
	}

	async authCheck(route:ActivatedRouteSnapshot, state:RouterStateSnapshot):Promise<boolean> {
		console.log('authCheck() %o', this.userService.user);

		if(!this.userService.user) {
			this.userService.redirect = state.url;
			this.router.navigate(['/login']);
			return false;
		}
		return true;

		// return this.userService.check().then(user => {
		// 	if(user) return true;
		// 	this.userService.redirect = state.url;
		// 	this.router.navigate(['/login']);
		// 	return false;
		// });
	}

	canActivate(route: ActivatedRouteSnapshot, state:RouterStateSnapshot) {
		// console.log('Guard.canActivate()');
		return this.authCheck(route, state);
	}

	canActivateChild(route:ActivatedRouteSnapshot, state:RouterStateSnapshot) {
		// console.log('Guard.canActivateChild()');
		return this.authCheck(route, state);
	}

}
