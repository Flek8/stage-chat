/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable max-len */
/* eslint-disable eqeqeq */
import { Component } from '@angular/core';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { EventMqttService } from './shared/services/event-mqtt.service';
import { environment } from '../environments/environment';
import { Subscription } from 'rxjs';
import { IStatus } from './features/models/IStatus';
import { IMessage} from './features/models/IMessage';
import { DataSharedService } from './shared/services/data-shared.service';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  subscriptions: Subscription[] = [];
  now: Date;
  onlineUsers: string[] = [];

  public appPages = [
    // { title: 'username', url: '/chat/username', time: 'timestamp', updateInterval: number },
  ];

  constructor(
    mqttService: EventMqttService,
    mqtt: MqttService,
    dataShared: DataSharedService,
    public auth: AuthService
  ) {

    const statusTopic = environment.MQTT.subscriptions.status;
    const messageTopic = environment.MQTT.subscriptions.message;

    this.subscriptions.push(
      mqttService.topic(statusTopic).subscribe((response: IMqttMessage) => {
        const rtn = response.payload.toString();
        if(rtn != '') {
          const status: IStatus = JSON.parse(rtn);
          dataShared.refreshData(status, null);
          if (this.onlineUsers.length === 0  && status.user !== auth.user) {
            this.onlineUsers.push(status.user);
            // const hours = new Date(status.timestamp).getHours();
            // const minutes = new Date(status.timestamp).getMinutes() < 10? '0' + new Date(status.timestamp).getMinutes() : new Date(status.timestamp).getMinutes();
            this.appPages.push({ title: status.user, url: `/chat/${status.user}`, time:  `${status.timestamp}`, updateInterval: 0});
            setInterval(() =>{if(this.appPages[0].updateInterval < 11) {this.appPages[0].updateInterval++;}}, 1000);
          } else {
            if(this.onlineUsers.includes(status.user)) {
              const updatePage = this.appPages.filter((value, index) => this.appPages[index].title === status.user)[0];
              // const hours = new Date(status.timestamp).getHours();
              // const minutes = new Date(status.timestamp).getMinutes() < 10? '0' + new Date(status.timestamp).getMinutes() : new Date(status.timestamp).getMinutes();
              updatePage.time = `${status.timestamp}`;
              updatePage.updateInterval = 0;
            } else {
              if (status.user !== auth.user) {
                this.onlineUsers.push(status.user);
                // const hours = new Date(status.timestamp).getHours();
                // const minutes = new Date(status.timestamp).getMinutes() < 10? '0' + new Date(status.timestamp).getMinutes() : new Date(status.timestamp).getMinutes();
                this.appPages.push({ title: status.user, url: `/chat/${status.user}`, time:  `${status.timestamp}`, updateInterval: 0});
                const newPage = this.appPages.filter((value, index) => this.appPages[index].title === status.user)[0];
                setInterval(() =>{if(newPage.updateInterval < 11) {newPage.updateInterval++;}}, 1000);
              }
            }
          }
        }
      })
    );

    this.subscriptions.push(
      mqttService.topic(messageTopic).subscribe((response: IMqttMessage) => {
        const rtn = response.payload.toString();
        if(rtn != '') {
          const message: IMessage = JSON.parse(rtn);
          dataShared.refreshData(null, message);
        }
      })
    );
  }
}
