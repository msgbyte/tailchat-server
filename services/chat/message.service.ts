import { PawService } from '../base';

class MessageService extends PawService {
  get serviceName(): string {
    return 'chat.message';
  }

  onInit(): void {
    this.registerDb('message');
  }
}

export default MessageService;
