import { PawService } from '../base';

class MailService extends PawService {
  get serviceName(): string {
    return 'mail';
  }

  onInit(): void {
    this.registerDb('user.mail');
  }
}

export default MailService;
