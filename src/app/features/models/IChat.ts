import { IMessage } from './IMessage';

export interface IChat {
  users: string[];
  messages: IMessage[];
}
