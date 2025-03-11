import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('pms-queue')
export class QueueProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'send-email':
        this.logger.log(`Processing email job: ${job.id}`);
        this.logger.log(`[EMAIL SEND SIMULATION] To: ${job.data.to}, Subject: ${job.data.subject}`);
        // In a real application, you'd use nodemailer or SendGrid here
        return { success: true };

      case 'process-audit':
        this.logger.log(`Processing audit log job: ${job.id}`);
        this.logger.log(`[AUDIT LOG] User ${job.data.userId} in workspace ${job.data.workspaceId} performed: ${job.data.action}`);
        return { success: true };

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return { success: false };
    }
  }
}
