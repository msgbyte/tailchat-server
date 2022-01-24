import { Runner } from 'moleculer';
import path from 'path';
import cluster from 'cluster';
import { config } from './lib/settings';

declare module 'moleculer' {
  class Runner {
    flags?: {
      config?: string;
      repl?: boolean;
      hot?: boolean;
      silent?: boolean;
      env?: boolean;
      envfile?: string;
      instances?: number;
      mask?: string;
    };
    servicePaths: string[];

    start(): void;
    startWorkers(instances: number): void;
    _run(): void;
  }
}

const isProd = config.env === 'production';

const runner = new Runner();
runner.flags = {
  hot: isProd ? false : true,
  repl: isProd ? false : true,
  env: true,
  config: path.resolve(__dirname, './moleculer.config.ts'),
};
runner.servicePaths = [
  'services/**/*.service.ts',
  'plugins/**/*.service.ts',
  'plugins/**/*.service.dev.ts', // load plugins in dev mode
];
function startRunner() {
  if (runner.flags.instances !== undefined && cluster.isMaster) {
    return runner.startWorkers(runner.flags.instances);
  }

  return runner._run();
}

startRunner();
