/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable max-len */
/* eslint-disable eqeqeq */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventMqttService } from './shared/services/event-mqtt.service';
import { environment } from '../environments/environment';
import { Subscription } from 'rxjs';
import { DataSharedService } from './shared/services/data-shared.service';
import { AuthService } from './shared/services/auth.service';
import { IPage } from './features/models/IPage';
import { NavigationEnd, Router } from '@angular/router';
import { MqttService } from 'ngx-mqtt';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];
  //now: Date;
  //onlineUsers: string[] = [];
  user: string;
  public appPages: IPage[] = [
    // { title: 'username', url: '/chat/username', time: 'timestamp', updateInterval: number },
  ];

  constructor(
    mqttService: EventMqttService,
    public dataShared: DataSharedService,
    public auth: AuthService,
    router: Router,
    public mqtt: MqttService
  ) {

    this.subscriptions.push(
      auth.pages$.subscribe((res: IPage[]) => {
        this.appPages = res;
        localStorage.setItem('pages', JSON.stringify(this.appPages));
        //console.log(this.appPages);
      })
    );
  }

  ngOnInit(): void {


      const time = new Date().getTime();
      if(localStorage.getItem('user') && new Date(JSON.parse(localStorage.getItem('user')).expirationDate).getTime() > time) {

        const user = JSON.parse(localStorage.getItem('user'));
        this.auth.user = user;

        const statusTopic = environment.MQTT.subscriptions.status;
        let now = new Date();
        this.mqtt.unsafePublish(statusTopic, `{"user": "${user.username}", "timestamp": "${now.toISOString()}"}`);
        setInterval( () => {
          if(user.username !== '') {
            now = new Date();
            this.mqtt.unsafePublish(statusTopic, `{"user": "${user.username}", "timestamp": "${now.toISOString()}"}`);
          }
        }, 1000);

        if (localStorage.getItem('onlineUsers')) {
          const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers'));
          this.auth.onlineUsers = onlineUsers;
        }
        if (localStorage.getItem('pages')) {
          const pages = JSON.parse(localStorage.getItem('pages'));
          this.auth.pagesSubject.next(pages);
          this.auth.authAppPages = pages;
          this.auth.authAppPages.forEach((page) => setInterval(() => {if (page.updateInterval < 6) {page.updateInterval++;}},1000));
        }
        if (localStorage.getItem('chats')) {
          const chats = JSON.parse(localStorage.getItem('chats'));
          this.dataShared.chats = chats;
        }

        this.auth.subscribe();
      }

  }

  ngOnDestroy(): void {
    console.log('destroy');
  }
}

