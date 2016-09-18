import { Component, ViewChild } from '@angular/core';
import { NavController, Nav, Storage, LocalStorage } from 'ionic-angular';
import {Http, Headers} from '@angular/http';
import {CORE_DIRECTIVES, FORM_DIRECTIVES} from '@angular/common';
import {JwtHelper} from 'angular2-jwt';


import 'rxjs/add/operator/map';

import {Util} from '../../shared/util';
import {HomeworksPage} from '../homeworks/homeworks';
import {ProfilePage} from '../profile/profile';
import {AuthService} from '../../shared/auth.service';

/*
  Generated class for the LoginPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
	templateUrl: 'build/pages/login/login.html',
	directives: [CORE_DIRECTIVES, FORM_DIRECTIVES]
})
export class LoginPage {

	// When the page loads, we want the Login segment to be selected
	authType: string = "login";
	error: string;
	jwtHelper: JwtHelper = new JwtHelper();
	local: Storage = new Storage(LocalStorage);
	user: string;
	roles: string;
	message:string;

	constructor(private http: Http, private auth: AuthService, private nav: NavController) {
	}

	login(credentials) {
		this.auth.login(credentials)
			.then(data => this.authSuccess(data.id_token))
			.catch(error => this.error = error);
	}

	signup(credentials) {
		this.auth.signup(credentials)
			.then(data => this.message=data.message)
			.catch(error => this.error = error);
	}

	logout() {
		this.local.remove('id_token');
		this.user = null;
	}

	authSuccess(token) {
		this.error = null;
		this.local.set('id_token', token);
		this.user = this.jwtHelper.decodeToken(token).username;

		var roles: string = Util.getDecodeObject(token).roles
		if (roles.indexOf('class') >= 0) {
			this.nav.setRoot(HomeworksPage);
		}
		else {
			this.nav.setRoot(ProfilePage);
		}
	}

}
