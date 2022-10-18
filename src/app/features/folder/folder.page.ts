/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable max-len */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { Subscription } from 'rxjs';
import { DataSharedService } from 'src/app/shared/services/data-shared.service';
import { EventMqttService } from '../../shared/services/event-mqtt.service';
import { IMessage } from '../models/IMessage';
import { IChat } from '../models/IChat';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit, OnDestroy {
  contact: string;
  subscriptions: Subscription[] = [];
  user: string;
  chat: IChat;
  messages: IMessage[];

  constructor(
    private activatedRoute: ActivatedRoute,
    public dataShared: DataSharedService,
    public mqttService: EventMqttService,
    public mqtt: MqttService,
    public auth: AuthService) {}

  ngOnInit() {
    this.user = this.auth.user;
    this.contact = this.activatedRoute.snapshot.paramMap.get('id');
    this.chat = this.dataShared.chats.filter((value, index) => this.dataShared.chats[index].users.includes(this.user) && this.dataShared.chats[index].users.includes(this.contact))[0];
    if (this.chat !== undefined) {
      this.messages = [];
      for (let i = 0; i < this.chat.messages.length; i++) {
        this.messages.push(this.chat.messages[i]);
      }
    }

    this.subscriptions.push(
      this.mqttService.topic(`stagechat/message/flavio_rodolfi`).subscribe((response: IMqttMessage) => {
        const rtn = response.payload.toString();
        if(rtn !== '') {
          this.chat = this.dataShared.chats.filter((value, index) => this.dataShared.chats[index].users.includes(this.user) && this.dataShared.chats[index].users.includes(this.contact))[0];
          if (this.chat !== undefined) {
            this.messages = [];
            for (let i = 0; i < this.chat.messages.length; i++) {
              console.log(this.chat.messages[i]);
              this.messages.push(this.chat.messages[i]);
            }
          }
        }
      })
    );
    // console.log('init');

    // console.log(this.contact.replace(' ', ''));

  }
  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  send(f: NgForm) {
    const now = new Date();
    console.log(f.value.textToSend);
    const text = f.value.textToSend;
    const messageToSend: IMessage = { sender: this.user,
                                      receiver: this.contact,
                                      timestamp: now,
                                      text: text
                                    };
    this.mqtt.unsafePublish(`stagechat/message/${this.contact.replace('.', '_')}`, `{"sender": "${this.user}", "receiver": "${this.contact}", "timestamp": "${now}", "text": "${text}" }` );
    this.dataShared.refreshData(null, messageToSend);
    this.chat = this.dataShared.chats.filter((value, index) => this.dataShared.chats[index].users.includes(this.user) && this.dataShared.chats[index].users.includes(this.contact))[0];
    if (this.chat !== undefined) {
      this.messages = [];
      for (let i = 0; i < this.chat.messages.length; i++) {
        this.messages.push(this.chat.messages[i]);
      }
      console.log(this.messages);
    }
    f.reset();
  }

}
