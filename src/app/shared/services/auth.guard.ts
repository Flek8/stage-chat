import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  isAuth = false;
    constructor(
        private auth: AuthService,
        private router: Router) {}
    canActivate() {
      if(this.auth.user !== '') {
        this.isAuth = true;
      }
      if (!this.isAuth) {
          this.router.navigateByUrl('login');
      }
      return this.isAuth;
    }
}
