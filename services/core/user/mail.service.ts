import { TcService } from '../../base';

class MailService extends TcService {
  get serviceName(): string {
    return 'mail';
  }

  onInit(): void {
    this.registerDb('user.mail');
  }
}

export default MailService;
