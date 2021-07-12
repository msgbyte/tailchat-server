import { PawService } from '../base';

class GroupService extends PawService {
  get serviceName(): string {
    return 'group';
  }

  onInit(): void {
    this.registerDb('group.group');
  }
}

export default GroupService;
