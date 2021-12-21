import { Types } from 'mongoose';
import type { TcDbService } from '../../../mixins/db.mixin';
import { TcService } from '../../../services/base';
import type { TcContext } from '../../../services/types';
import type { TaskDocument, TaskModel } from '../models/task';

/**
 * 用户服务
 */
interface TasksService
  extends TcService,
    TcDbService<TaskDocument, TaskModel> {}
class TasksService extends TcService {
  get serviceName() {
    return 'plugin:com.msgbyte.tasks';
  }

  onInit() {
    this.registerLocalDb(require('../models/task'));

    this.registerAction('add', this.add, {
      params: {
        title: 'string',
        assignee: { optional: true, type: 'string' },
        description: { optional: true, type: 'string' },
        expiredAt: { optional: true, type: 'date' },
      },
    });
    this.registerAction('done', this.done, {
      params: {
        taskId: 'string',
      },
    });
    this.registerAction('update', this.update, {
      params: {
        taskId: 'string',
        title: { optional: true, type: 'string' },
        assignee: { optional: true, type: 'string' },
        description: { optional: true, type: 'string' },
        expiredAt: { optional: true, type: 'date' },
      },
    });
  }

  /**
   * 新增任务
   */
  private async add(
    ctx: TcContext<{
      title: string;
      assignee: string;
      description: string;
      expiredAt: Date;
    }>
  ) {
    const { title, assignee, description, expiredAt } = ctx.params;
    const docs = await this.adapter.model.create({
      creator: ctx.meta.userId,
      title,
      assignee,
      description,
      expiredAt,
      done: false,
    });

    return await this.transformDocuments(ctx, {}, docs);
  }

  /**
   * 完成任务
   */
  private async done(
    ctx: TcContext<{
      taskId: string;
    }>
  ) {
    const taskId = ctx.params.taskId;
    const docs = await this.adapter.model.updateOne(
      {
        _id: taskId,
        creator: ctx.meta.userId,
      },
      {
        done: true,
      },
      {
        new: true,
      }
    );

    return await this.transformDocuments(ctx, {}, docs);
  }

  /**
   * 更新任务信息
   */
  private async update(
    ctx: TcContext<{
      taskId: string;
      title: string;
      assignee: string;
      description: string;
      expiredAt: Date;
    }>
  ) {
    const { taskId, title, assignee, description, expiredAt } = ctx.params;
    const docs = await this.adapter.model.updateOne(
      {
        _id: taskId,
        creator: ctx.meta.userId,
      },
      {
        title,
        assignee,
        description,
        expiredAt,
      },
      { new: true }
    );

    return await this.transformDocuments(ctx, {}, docs);
  }
}

export default TasksService;
