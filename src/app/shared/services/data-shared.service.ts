/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable} from '@angular/core';
import { Subject } from 'rxjs';
import { IMessage } from 'src/app/features/models/IMessage';
import { IPage } from 'src/app/features/models/IPage';
import { IStatus } from 'src/app/features/models/IStatus';
import { IChat } from '../../features/models/IChat';

@Injectable({
  providedIn: 'root'
})
export class DataSharedService {

  public chats: IChat[] = [];
  public pages: IPage[] = [];



  refreshData(message: IMessage | null) {
    if(message != null) {

      message.timestamp = new Date(message.timestamp);
      if (this.chats.length === 0) {
        const chatItem: IChat = {
          users: [message.receiver, message.sender],
          messages: [message]
        };

        this.chats.push(chatItem);
      } else {
        for (let i = 0; i < this.chats.length; i++) {
          if (this.chats[i].users.includes(message.receiver) && this.chats[i].users.includes(message.sender)) {

            message.timestamp = new Date(message.timestamp);
            this.chats[i].messages.push(message);

            return;

          } else {
            const chatItem: IChat = {
              users: [message.receiver, message.sender],
              messages: []
            };

            this.chats.push(chatItem);

          }

        }

      }


    }

  }
}
