import { TcService } from '../base';

class ChannelService extends TcService {
  get serviceName(): string {
    return 'group.panel';
  }

  onInit(): void {
    this.registerDb('group.panel');
  }
}

export default ChannelService;
