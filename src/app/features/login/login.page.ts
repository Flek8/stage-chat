import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnDestroy {
  showPassword = false;

  constructor(public auth: AuthService) { }


  handlePassword() {
    this.showPassword = !this.showPassword;
  }

  ngOnDestroy(): void {
  }

}
