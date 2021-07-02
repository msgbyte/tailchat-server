import { PawService } from '../base';

class MailService extends PawService {
  get serviceName(): string {
    return 'mail';
  }

  onInit(): void {
    this.registerDb('mail');
  }
}

export default MailService;
