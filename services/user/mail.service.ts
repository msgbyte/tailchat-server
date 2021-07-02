import { PawService } from '../base';

export class MailService extends PawService {
  get serviceName(): string {
    return 'mail';
  }

  onInit(): void {
    this.registerDb('mail');
  }
}
