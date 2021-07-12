import { PawService } from '../base';

class ConverseService extends PawService {
  get serviceName(): string {
    return 'chat.converse';
  }

  onInit(): void {
    this.registerDb('chat.converse');
  }
}

export default ConverseService;
