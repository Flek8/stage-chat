/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable max-len */
import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { Subscription } from 'rxjs';
import { DataSharedService } from 'src/app/shared/services/data-shared.service';
import { EventMqttService } from '../../shared/services/event-mqtt.service';
import { IMessage } from '../models/IMessage';
import { IChat } from '../models/IChat';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { IPage } from '../models/IPage';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  contact: string;
  subscriptions: Subscription[] = [];
  user: string;
  chat: IChat;
  messages: IMessage[];
  folderPages: IPage[];
  id: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    public dataShared: DataSharedService,
    public mqttService: EventMqttService,
    public mqtt: MqttService,
    public auth: AuthService) {}

  ngOnInit() {
    const messageTopic = environment.MQTT.subscriptions.message;
    this.user = this.auth.user;
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    const idName = this.id.split('.')[0];
    const idSurname = this.id.split('.')[1];
    const name = idName.charAt(0).toUpperCase() + idName.slice(1);
    const surname = idSurname.charAt(0).toUpperCase() + idSurname.slice(1);
    this.contact = name + ' ' + surname;
    this.chat = this.dataShared.chats.filter((value, index) => this.dataShared.chats[index].users.includes(this.user) && this.dataShared.chats[index].users.includes(this.id))[0];
    if (this.chat !== undefined) {
      this.messages = [];
      for (let i = 0; i < this.chat.messages.length; i++) {
        this.messages.push(this.chat.messages[i]);
      }
    }

    this.subscriptions.push(
      this.mqttService.topic(`${messageTopic}${this.auth.topicUser}`).subscribe((response: IMqttMessage) => {
        const rtn = response.payload.toString();
        if(rtn !== '') {
          this.chat = this.dataShared.chats.filter((value, index) => this.dataShared.chats[index].users.includes(this.user) && this.dataShared.chats[index].users.includes(this.id))[0];
          if (this.chat !== undefined) {
            this.messages = [];
            for (let i = 0; i < this.chat.messages.length; i++) {
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
    if (f.value.textToSend) {
      this.folderPages = this.dataShared.pages;
      const now = new Date();
      const text = f.value.textToSend;
      // const messageToSend: IMessage = { sender: this.user,
      //                                   receiver: this.contact,
      //                                   timestamp: now,
      //                                   text: text
      //                                 };
      this.mqtt.unsafePublish(`stagechat/message/${this.id.replace('.', '_')}`, `{"sender": "${this.user}", "receiver": "${this.id}", "timestamp": "${now}", "text": "${text}" }` );
      this.mqtt.unsafePublish(`stagechat/message/flavio_rodolfi`, `{"sender": "${this.user}", "receiver": "${this.id}", "timestamp": "${now}", "text": "${text}" }` );

      // this.dataShared.refreshData(null, messageToSend);
      // this.chat = this.dataShared.chats.filter((value, index) => this.dataShared.chats[index].users.includes(this.user) && this.dataShared.chats[index].users.includes(this.contact))[0];
      // if (this.chat !== undefined) {
      //   this.messages = [];
      //   for (let i = 0; i < this.chat.messages.length; i++) {
      //     this.messages.push(this.chat.messages[i]);
      //   }
      //   console.log(this.messages);
      // }
      // const pageUpdate = this.folderPages.filter((value, index) => this.folderPages[index].title === messageToSend.receiver || this.folderPages[index].title === messageToSend.sender)[0];
      // this.folderPages = this.folderPages.filter((value, index) => this.folderPages[index].title !== messageToSend.sender && this.folderPages[index].title !== messageToSend.receiver);
      // this.folderPages.splice(0, 0, pageUpdate);
      // this.dataShared.pages = this.folderPages;
      f.reset();
    }
  }

  ngAfterViewChecked(): void {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
  }

}
