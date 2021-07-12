import { PawService } from '../base';

class ChannelService extends PawService {
  get serviceName(): string {
    return 'group.panel';
  }

  onInit(): void {
    this.registerDb('group.panel');
  }
}

export default ChannelService;
