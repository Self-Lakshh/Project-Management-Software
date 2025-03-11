import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('pms-queue') private pmsQueue: Queue,
  ) {}

  async addEmailJob(to: string, subject: string, body: string) {
    await this.pmsQueue.add('send-email', { to, subject, body }, {
      attempts: 3,
      backoff: 1000,
    });
  }

  async addAuditLogJob(userId: string, workspaceId: string, action: string, details: any) {
    await this.pmsQueue.add('process-audit', { userId, workspaceId, action, details }, {
      removeOnComplete: true,
    });
  }
}
