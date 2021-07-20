import { TcService } from '../base';

class GroupService extends TcService {
  get serviceName(): string {
    return 'group';
  }

  onInit(): void {
    this.registerDb('group.group');
  }
}

export default GroupService;
