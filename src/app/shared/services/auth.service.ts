/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { ToastController } from '@ionic/angular';
import { IUser } from '../../features/models/IUser';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    data: IAuth;
    error: any;
    user: IUser = {
      firstName: '',
      lastName: '',
      username: '',
      email: null,
      token: null,
      expirationDate: null
    };
    topicUser = '';
    token: string;
    expDate: string;
    tokenApiUrl = environment.API.login;
    userApiUrl = environment.API.infoUtente;
    statusTopic = environment.MQTT.subscriptions.status;
    messageTopic = environment.MQTT.subscriptions.message;
    userFullName: string;
    pagesSubject = new Subject<IPage[]>();
    pages$ = this.pagesSubject.asObservable();
    activeRoute = '';

    // subscribe() properties
    subscriptions: Subscription[] = [];
    onlineUsers: string[] = [];
    authAppPages: IPage[] = [];



    constructor(
        private http: HttpClient,
        public mqttService: EventMqttService,
        public dataShared: DataSharedService,
        private router: Router,
        public mqtt: MqttService,
        private toastController: ToastController,
        public route: ActivatedRoute) {}

    login(f: NgForm) {

        this.error = null;
        const username64 = btoa(f.value.username);
        const password64 = btoa(f.value.password);
        this.data = {username: username64 , password: password64};
        // eslint-disable-next-line @typescript-eslint/ban-types
        this.http.post<ITokenResponse>(this.tokenApiUrl, this.data)
          .subscribe(async res => {
            if (res.success === true) {
              this.token = res.data.token;
              this.expDate = res.data.expirationDate;
              const httpOptions = {
                headers: new HttpHeaders({
                  Authorization: 'Bearer ' + this.token
                })
              };
              this.http.get<IUserResponse>(this.userApiUrl, httpOptions)
                .subscribe(r => {
                  if (r.success) {
                    this.user = {
                      firstName: r.data.nome,
                      lastName: r.data.cognome,
                      username: r.data.username,
                      email: r.data.email,
                      token: this.token,
                      expirationDate: this.expDate
                    };
                    //const contact = this.route.snapshot.paramMap.get('id');
                    localStorage.setItem('user', JSON.stringify(this.user));

                    this.userFullName = r.data.nome + ' ' + r.data.cognome;
                    this.router.navigateByUrl('home',{replaceUrl: true});
                    let now = new Date();
                    this.mqtt.unsafePublish(this.statusTopic, `{"user": "${this.user.username}", "timestamp": "${now.toISOString()}"}`);
                    setInterval( () => {
                      if(this.user.username !== '') {
                        now = new Date();
                        this.mqtt.unsafePublish(this.statusTopic, `{"user": "${this.user.username}", "timestamp": "${now.toISOString()}"}`);
                      }
                    }, 1000);

                    this.subscribe();
                    setTimeout(() => f.reset(), 1000);
                  }
                });
            } else {
              const toast = this.toastController.create({
                message: 'Le credenziali inserite sono errate!',
                duration: 2500,
                position: 'bottom',
                color: 'danger'
              });

              (await toast).present();

            }
          });

    }

    logout() {
      this.router.navigateByUrl('login',{replaceUrl: true});
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.data = null;
      this.user = {
        firstName: '',
        lastName: '',
        username: '',
        email: null,
        token: null,
        expirationDate: null
      };
      localStorage.clear();
      this.authAppPages = [];
      this.onlineUsers = [];
      this.dataShared.pages = [];
      this.dataShared.chats = [];
      this.subscriptions = [];
      this.pagesSubject.next();
    }

  subscribe() {
    const statusTopic = environment.MQTT.subscriptions.status;
    const messageTopic = environment.MQTT.subscriptions.message;
    if(this.user.username !== ''){
    this.subscriptions.push(
      this.mqttService.topic(statusTopic).pipe().subscribe((response: IMqttMessage) => {
        const rtn = response.payload.toString();
        if(rtn !== '') {
          //this.user.username = auth.userFullName;
          // this.authAppPages = this.dataShared.pages;
          const status: IStatus = JSON.parse(rtn);
          if (this.onlineUsers.length === 0  && status.user !== this.user.username) {
            this.onlineUsers.push(status.user);

            this.authAppPages.push({ title: status.user, url: `/chat/${status.user}`, time:  `${status.timestamp}`, updateInterval: 0, unreadMessages: 0});
            setInterval(() =>{if(this.authAppPages[0] && this.authAppPages[0].updateInterval < 6) {this.authAppPages[0].updateInterval++;}}, 1000);
            //this.pagesSubject.next(this.authAppPages);
          } else {
            if(this.onlineUsers.includes(status.user)) {
              const updatePage = this.authAppPages.filter((value, index) => this.authAppPages[index].title === status.user)[0];
              updatePage.time = `${status.timestamp}`;
              updatePage.updateInterval = 0;
            } else {
              if (status.user !== this.user.username) {
                this.onlineUsers.push(status.user);
                this.authAppPages.push({ title: status.user, url: `/chat/${status.user}`, time:  `${status.timestamp}`, updateInterval: 0, unreadMessages: 0});
                const newPage = this.authAppPages.filter((value, index) => this.authAppPages[index].title === status.user)[0];
                setInterval(() =>{if(newPage.updateInterval < 6) {newPage.updateInterval++;}}, 1000);
                //this.pagesSubject.next(this.authAppPages);
                //console.log(this.authAppPages);
              }
            }
          }
          localStorage.setItem('onlineUsers', JSON.stringify(this.onlineUsers));
          this.pagesSubject.next(this.authAppPages);
          // this.dataShared.pages = this.authAppPages;
        }
        this.topicUser = this.user.username.replace('.','_');
        if(this.topicUser !== '' && this.subscriptions.length < 2) {
          this.subscriptions.push(
            this.mqttService.topic(`${messageTopic}${this.topicUser}`).subscribe(async (responseM: IMqttMessage) => {
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
                if(message.sender !== this.activeRoute) {
                  const notificationPage: IPage = this.authAppPages.filter((value, index) => this.authAppPages[index].title === message.sender)[0];
                  notificationPage.unreadMessages++;
                  this.pagesSubject.next(this.authAppPages);
                  const toast = this.toastController.create({
                    message: 'Nuovo messaggio da ' + message.sender,
                    duration: 2500,
                    position: 'bottom',
                    color: 'success'
                  });
                  (await toast).present();
                }

              }
            })
          );
        }
      })
    );
    }
  }
}


