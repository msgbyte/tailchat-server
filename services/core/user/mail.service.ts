import type { TcDbService } from '../../../mixins/db.mixin';
import type { MailDocument, MailModel } from '../../../models/user/mail';
import { TcService } from '../../base';
import type { TcContext } from '../../types';

interface MailService extends TcService, TcDbService<MailDocument, MailModel> {}
class MailService extends TcService {
  smtpServiceAvailable = false;

  get serviceName(): string {
    return 'mail';
  }

  onInit(): void {
    this.registerDb('user.mail');

    this.registerAction('sendMail', this.sendMail, {
      visibility: 'public',
      params: {
        to: 'string',
        subject: 'string',
        html: 'string',
      },
    });
  }

  onInited() {
    this.adapter.model.verifyMailService().then((available) => {
      if (available) {
        this.logger.info('SMTP 服务可用');
      } else {
        this.logger.warn('SMTP 服务不可用');
      }

      this.smtpServiceAvailable = available;
    });
  }

  /**
   * 发送邮件
   */
  async sendMail(
    ctx: TcContext<{
      to: string;
      subject: string;
      html: string;
    }>
  ) {
    if (!this.smtpServiceAvailable) {
      throw new Error('SMTP 服务不可用');
    }

    const { to, subject, html } = ctx.params;

    await this.adapter.model.sendMail({
      to,
      subject,
      html,
    });
  }
}

export default MailService;
