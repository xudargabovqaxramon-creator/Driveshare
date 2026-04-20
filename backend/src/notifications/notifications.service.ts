import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from './entities/notification.entity';

export interface CreateNotificationPayload {
  userId: string;
  message: string;
  type: NotificationType;
  relatedEntity?: string;
  relatedEntityId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  /**
   * Persist a notification. Swallows errors so notification failures never
   * bubble up to disrupt core business flows.
   */
  async notify(payload: CreateNotificationPayload): Promise<void> {
    try {
      await this.repo.save(this.repo.create(payload));
    } catch (err) {
      this.logger.error('Failed to create notification', err);
    }
  }

  /** Get unread count for a user */
  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  /** Paginated list of notifications for a user, newest first */
  async findForUser(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<{ data: Notification[]; total: number }> {
    const where: Record<string, any> = { userId };
    if (unreadOnly) where.isRead = false;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  /** Mark a single notification as read (ownership validated at controller) */
  async markRead(id: string, userId: string): Promise<Notification> {
    const n = await this.repo.findOne({ where: { id, userId } });
    if (!n) throw new NotFoundException('Notification not found');
    n.isRead = true;
    return this.repo.save(n);
  }

  /** Mark ALL notifications for a user as read */
  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }
}
