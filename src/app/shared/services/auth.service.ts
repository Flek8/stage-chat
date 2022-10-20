/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IAuth } from 'src/app/features/models/IAuth';
import { ITokenResponse } from '../../features/models/ITokenResponse';
import { environment } from '../../../environments/environment';
import { IUserResponse } from '../../features/models/IUserResponse';
import { MqttService } from 'ngx-mqtt';
import { Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    data: IAuth;
    error: any;
    user = '';
    topicUser = '';
    token: string;
    tokenApiUrl = environment.API.login;
    userApiUrl = environment.API.infoUtente;
    statusTopic = environment.MQTT.subscriptions.status;
    messageTopic = environment.MQTT.subscriptions.message;
    userInfo: string;

    constructor(
        private http: HttpClient,
        private router: Router,
        public mqtt: MqttService) {}

    login({username, password}: {username: string; password: string}) {

        this.error = null;
        const username64 = btoa(username);
        const password64 = btoa(password);
        this.data = {username: username64 , password: password64};
        // eslint-disable-next-line @typescript-eslint/ban-types
        this.http.post<ITokenResponse>(this.tokenApiUrl, this.data)
          .subscribe(res => {
            console.log(res);
            if (res.success === true) {
              this.token = res.data.token;
              const httpOptions = {
                headers: new HttpHeaders({
                  Authorization: 'Bearer ' + this.token
                })
              };
              this.http.get<IUserResponse>(this.userApiUrl, httpOptions)
                .subscribe(r => {
                  if (r.success) {
                    this.router.navigateByUrl('home');
                    this.user = r.data.username;
                    this.topicUser = r.data.username.replace('.','_');
                    this.userInfo = r.data.nome + ' ' + r.data.cognome;
                    let now = new Date();
                    this.mqtt.unsafePublish(this.statusTopic, `{"user": "${this.user}", "timestamp": "${now}"}`);
                    setInterval( () => {
                      now = new Date();
                      this.mqtt.unsafePublish(this.statusTopic, `{"user": "${this.user}", "timestamp": "${now}"}`);
                    }, 2000);
                  }
                });
            }
          });
    }

    logout() {
        this.data = null;
        this.user = '';
        this.router.navigateByUrl('login');
    }

  // subscribe() {

  // }
}

