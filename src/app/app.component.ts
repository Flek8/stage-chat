/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable max-len */
/* eslint-disable eqeqeq */
import { Component } from '@angular/core';
import { EventMqttService } from './shared/services/event-mqtt.service';
import { environment } from '../environments/environment';
import { Subscription } from 'rxjs';
import { DataSharedService } from './shared/services/data-shared.service';
import { AuthService } from './shared/services/auth.service';
import { IPage } from './features/models/IPage';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  subscriptions: Subscription[] = [];
  //now: Date;
  //onlineUsers: string[] = [];
  user: string;
  public appPages: IPage[] = [
    // { title: 'username', url: '/chat/username', time: 'timestamp', updateInterval: number },
  ];

  constructor(
    mqttService: EventMqttService,
    dataShared: DataSharedService,
    public auth: AuthService
  ) {

    const statusTopic = environment.MQTT.subscriptions.status;

    this.subscriptions.push(
      auth.pages$.subscribe((res: IPage[]) => {
        this.appPages = res;
        //console.log(this.appPages);
      })
      // mqttService.topic(statusTopic).subscribe((response: IMqttMessage) => {
      //   const rtn = response.payload.toString();
      //   if(rtn !== '') {
      //     this.user = auth.userFullName;
      //     this.appPages = auth.authAppPages;
      //   }
      // })
    );
    // const statusTopic = environment.MQTT.subscriptions.status;
    // const messageTopic = environment.MQTT.subscriptions.message;

    // this.subscriptions.push(
    //   mqttService.topic(statusTopic).subscribe((response: IMqttMessage) => {
    //     const rtn = response.payload.toString();
    //     if(rtn != '') {
    //       this.user = auth.userFullName;
    //       this.appPages = dataShared.pages;
    //       const status: IStatus = JSON.parse(rtn);
    //       if (this.onlineUsers.length === 0  && status.user !== auth.user) {
    //         this.onlineUsers.push(status.user);

    //         this.appPages.push({ title: status.user, url: `/chat/${status.user}`, time:  `${status.timestamp}`, updateInterval: 0, unreadMessages: 0});
    //         setInterval(() =>{if(this.appPages[0].updateInterval < 6) {this.appPages[0].updateInterval++;}}, 1000);
    //       } else {
    //         if(this.onlineUsers.includes(status.user)) {
    //           const updatePage = this.appPages.filter((value, index) => this.appPages[index].title === status.user)[0];
    //           updatePage.time = `${status.timestamp}`;
    //           updatePage.updateInterval = 0;
    //         } else {
    //           if (status.user !== auth.user) {
    //             this.onlineUsers.push(status.user);
    //             this.appPages.push({ title: status.user, url: `/chat/${status.user}`, time:  `${status.timestamp}`, updateInterval: 0, unreadMessages: 0});
    //             const newPage = this.appPages.filter((value, index) => this.appPages[index].title === status.user)[0];
    //             setInterval(() =>{if(newPage.updateInterval < 11) {newPage.updateInterval++;}}, 1000);
    //           }
    //         }
    //       }
    //       dataShared.pages = this.appPages;
    //     }
    //     if(auth.topicUser !== '' && this.subscriptions.length < 2) {
    //       this.subscriptions.push(
    //         mqttService.topic(`${messageTopic}${auth.topicUser}`).subscribe((responseM: IMqttMessage) => {
    //           const rtnM = responseM.payload.toString();
    //           if(rtnM != '') {
    //             this.appPages = dataShared.pages;
    //             const message: IMessage = JSON.parse(rtnM);
    //             this.appPages.forEach((page) => {
    //               if(page.title === message.sender || page.title === message.receiver){
    //                 dataShared.refreshData(message);
    //                 const pageUpdate = this.appPages.filter((value, index) => this.appPages[index].title === message.receiver || this.appPages[index].title === message.sender)[0];
    //                 this.appPages = this.appPages.filter((value, index) => this.appPages[index].title !== message.sender && this.appPages[index].title !== message.receiver);
    //                 this.appPages.splice(0, 0, pageUpdate);
    //                 dataShared.pages = this.appPages;
    //               }
    //             });
    //           }
    //         })
    //       );
    //     }
    //   })
    // );
  }
}

