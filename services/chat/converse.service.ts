import { PawService } from '../base';

class ChannelService extends PawService {
  get serviceName(): string {
    return 'chat.converse';
  }

  onInit(): void {
    this.registerDb('converse');
  }
}

export default ChannelService;
