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

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    data: IAuth;
    error: any;
    user = '';
    token: string;
    tokenApiUrl = environment.API.login;
    userApiUrl = environment.API.infoUtente;
    statusTopic = environment.MQTT.subscriptions.status;
    messageTopic = environment.MQTT.subscriptions.message;

    constructor(
        private http: HttpClient,
        private router: Router,
        public mqtt: MqttService) {}

    login({username, password}: {username: string; password: string}) {

        this.error = null;
        const username64 = btoa(username);
        const password64 = btoa(password);
        this.data = {username: username64 , password: password64};
        // if(username === password) {
        //   this.data.name = username;
        //   console.log(this.data.name);
        //   this.router.navigateByUrl('chat/nessun utente online');
        // }
        // eslint-disable-next-line @typescript-eslint/ban-types
        this.http.post<ITokenResponse>(this.tokenApiUrl, this.data )
          .subscribe(res => {
            console.log(res);
            if (res.success) {
              this.token = res.data.token;
              const httpOptions = {
                headers: new HttpHeaders({
                  Authorization: 'Bearer ' + this.token
                })
              };
              this.http.get<IUserResponse>(this.userApiUrl, httpOptions)
                .subscribe(r => {
                  if (r.success) {
                    this.user = r.data.username;
                    const now = new Date();
                    this.mqtt.unsafePublish(this.statusTopic, `{"user": "${this.user}", "timestamp": "${now}"}`);
                    // setInterval( () => {
                    //   now = new Date();
                    //   this.mqtt.unsafePublish(this.statusTopic, `{"user": "mario.rossi", "timestamp": "${now}"}`);
                    //   //this.mqtt.unsafePublish(this.messageTopic, `{ "sender": "mario.rossi", "receiver":"flavio.rodolfi", "timestamp": "Mon Oct 17 2022 12:17:37 GMT+0200 (Central European Summer Time)", "text": "ciao" }`);
                    // }, 2000);
                    this.router.navigateByUrl('chat/');
                  }
                });
            }
          });

        // this.http.get<IAuth>(`http://localhost:8100/login`, { params })
        //     .subscribe(
        //         res => {
        //             this.data = res;
        //             this.router.navigateByUrl('');
        //         },
        //         err => this.error = err
        //     );
    }

    logout() {
        this.data = null;
        this.router.navigateByUrl('login');
    }
}

