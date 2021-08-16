import { TcService } from './base';
import type { TcContext } from './types';
import path from 'path';
import { uploadDir } from '../lib/settings';
import { sync as mkdir } from 'mkdirp';
import fs from 'fs';

mkdir(uploadDir);

export default class FileService extends TcService {
  get serviceName(): string {
    return 'file';
  }

  onInit(): void {
    this.registerAction('save', this.save);
  }

  save(
    ctx: TcContext<
      {},
      {
        $params: any;
        filename: any;
      }
    >
  ) {
    this.logger.info('Received upload $params:', ctx.meta.$params);

    return new this.Promise((resolve, reject) => {
      //reject(new Error("Disk out of space"));
      const filePath = path.join(
        uploadDir,
        ctx.meta.filename || this.randomName()
      );
      const f = fs.createWriteStream(filePath);
      f.on('close', () => {
        // File written successfully
        this.logger.info(`Uploaded file stored in '${filePath}'`);
        resolve({ filePath, meta: ctx.meta });
      });

      (ctx.params as any).on('error', (err) => {
        this.logger.info('File error received', err.message);
        reject(err);

        // Destroy the local file
        f.destroy(err);
      });

      f.on('error', () => {
        // Remove the errored file.
        fs.unlinkSync(filePath);
      });

      (ctx.params as any).pipe(f);
    });
  }

  randomName() {
    return 'unnamed_' + Date.now();
  }
}
