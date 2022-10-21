/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IAuth } from 'src/app/features/models/IAuth';
import { ITokenResponse } from '../../features/models/ITokenResponse';
import { environment } from '../../../environments/environment';
import { IUserResponse } from '../../features/models/IUserResponse';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { Subject, Subscription } from 'rxjs';
import { EventMqttService } from './event-mqtt.service';
import { DataSharedService } from './data-shared.service';
import { IStatus } from 'src/app/features/models/IStatus';
import { IPage } from 'src/app/features/models/IPage';
import { IMessage } from 'src/app/features/models/IMessage';
import { NgForm } from '@angular/forms';

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
    userFullName: string;
    pagesSubject = new Subject<IPage[]>();
    pages$ = this.pagesSubject.asObservable();

    // subscribe() properties
    subscriptions: Subscription[] = [];
    onlineUsers: string[] = [];
    authAppPages: IPage[] = [];



    constructor(
        private http: HttpClient,
        public mqttService: EventMqttService,
        public dataShared: DataSharedService,
        private router: Router,
        public mqtt: MqttService) {}

    login(f: NgForm) {

        console.log(f);
        this.error = null;
        const username64 = btoa(f.value.username);
        const password64 = btoa(f.value.password);
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
                    this.user = r.data.username;
                    this.topicUser = r.data.username.replace('.','_');
                    this.userFullName = r.data.nome + ' ' + r.data.cognome;
                    this.router.navigateByUrl('home');
                    let now = new Date();
                    this.mqtt.unsafePublish(this.statusTopic, `{"user": "${this.user}", "timestamp": "${now}"}`);
                    setInterval( () => {
                      if(this.user !== '') {
                        now = new Date();
                        this.mqtt.unsafePublish(this.statusTopic, `{"user": "${this.user}", "timestamp": "${now}"}`);
                      }
                    }, 1000);

                    this.subscribe();
                  }
                });
            }
          });
        setTimeout(() => f.reset(), 500);

    }

    logout() {
      this.router.navigateByUrl('login');
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.data = null;
      this.user = '';
      this.authAppPages = [];
      this.onlineUsers = [];
      this.dataShared.pages = [];
      this.dataShared.chats = [];
      this.subscriptions = [];
      this.pagesSubject.next();
      console.log(this.dataShared.chats);
      console.log(this.subscriptions.length);
    }

  subscribe() {
    const statusTopic = environment.MQTT.subscriptions.status;
    const messageTopic = environment.MQTT.subscriptions.message;
    if(this.user !== ''){
    this.subscriptions.push(
      this.mqttService.topic(statusTopic).pipe().subscribe((response: IMqttMessage) => {
        const rtn = response.payload.toString();
        if(rtn !== '') {
          //this.user = auth.userFullName;
          // this.authAppPages = this.dataShared.pages;
          const status: IStatus = JSON.parse(rtn);
          if (this.onlineUsers.length === 0  && status.user !== this.user) {
            this.onlineUsers.push(status.user);

            this.authAppPages.push({ title: status.user, url: `/chat/${status.user}`, time:  `${status.timestamp}`, updateInterval: 0, unreadMessages: 0});
            setInterval(() =>{if(this.authAppPages[0] && this.authAppPages[0].updateInterval < 6) {this.authAppPages[0].updateInterval++;}}, 1000);
            this.pagesSubject.next(this.authAppPages);
          } else {
            if(this.onlineUsers.includes(status.user)) {
              const updatePage = this.authAppPages.filter((value, index) => this.authAppPages[index].title === status.user)[0];
              updatePage.time = `${status.timestamp}`;
              updatePage.updateInterval = 0;
            } else {
              if (status.user !== this.user) {
                this.onlineUsers.push(status.user);
                this.authAppPages.push({ title: status.user, url: `/chat/${status.user}`, time:  `${status.timestamp}`, updateInterval: 0, unreadMessages: 0});
                const newPage = this.authAppPages.filter((value, index) => this.authAppPages[index].title === status.user)[0];
                setInterval(() =>{if(newPage.updateInterval < 6) {newPage.updateInterval++;}}, 1000);
                this.pagesSubject.next(this.authAppPages);
                //console.log(this.authAppPages);
              }
            }
          }

          // this.dataShared.pages = this.authAppPages;
        }
        if(this.topicUser !== '' && this.subscriptions.length < 2) {
          this.subscriptions.push(
            this.mqttService.topic(`${messageTopic}${this.topicUser}`).subscribe((responseM: IMqttMessage) => {
              const rtnM = responseM.payload.toString();
              if(rtnM !== '') {
                const message: IMessage = JSON.parse(rtnM);
                this.authAppPages.forEach((page) => {
                  if(page.title === message.sender || page.title === message.receiver){
                    this.dataShared.refreshData(message);
                    const pageUpdate = this.authAppPages.filter((value, index) => this.authAppPages[index].title === message.receiver || this.authAppPages[index].title === message.sender)[0];
                    this.authAppPages = this.authAppPages.filter((value, index) => this.authAppPages[index].title !== message.sender && this.authAppPages[index].title !== message.receiver);
                    this.authAppPages.splice(0, 0, pageUpdate);
                    this.pagesSubject.next(this.authAppPages);
                  }
                });
              }
            })
          );
        }
      })
    );
    }
  }
}


