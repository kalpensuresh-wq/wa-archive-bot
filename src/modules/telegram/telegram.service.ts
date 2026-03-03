import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InlineKeyboardButton } from 'telegraf/types';
import { AccountStatus, BroadcastStatus, SendStatus } from '@prisma/client';

@Injectable()
export class TelegramService {
  constructor(private readonly configService: ConfigService) {}

  isAdmin(telegramId: number): boolean {
    const adminIds = this.configService.get<number[]>('telegram.adminIds') || [];
    return adminIds.includes(telegramId);
  }

  getAccountStatusEmoji(status: AccountStatus): string {
    const statusMap: Record<AccountStatus, string> = {
      DISCONNECTED: '🔴',
      CONNECTING: '🟡',
      QR_READY: '📱',
      CONNECTED: '🟢',
      AUTH_FAILURE: '❌',
    };
    return statusMap[status] || '❓';
  }

  getAccountStatusText(status: AccountStatus): string {
    const statusMap: Record<AccountStatus, string> = {
      DISCONNECTED: 'Отключен',
      CONNECTING: 'Подключение...',
      QR_READY: 'Ожидает QR',
      CONNECTED: 'Подключен',
      AUTH_FAILURE: 'Ошибка авторизации',
    };
    return statusMap[status] || 'Неизвестно';
  }

  getBroadcastStatusEmoji(status: BroadcastStatus): string {
    const statusMap: Record<BroadcastStatus, string> = {
      DRAFT: '📝',
      SCHEDULED: '⏰',
      RUNNING: '▶️',
      PAUSED: '⏸',
      COMPLETED: '✅',
      FAILED: '❌',
    };
    return statusMap[status] || '❓';
  }

  getBroadcastStatusText(status: BroadcastStatus): string {
    const statusMap: Record<BroadcastStatus, string> = {
      DRAFT: 'Черновик',
      SCHEDULED: 'Запланирована',
      RUNNING: 'Выполняется',
      PAUSED: 'Приостановлена',
      COMPLETED: 'Завершена',
      FAILED: 'Ошибка',
    };
    return statusMap[status] || 'Неизвестно';
  }

  getSendStatusEmoji(status: SendStatus): string {
    const statusMap: Record<SendStatus, string> = {
      PENDING: '⏳',
      SENDING: '📤',
      SENT: '✅',
      FAILED: '❌',
    };
    return statusMap[status] || '❓';
  }

  backButton(callbackData: string = 'back_to_menu'): InlineKeyboardButton {
    return { text: '◀️ Назад', callback_data: callbackData };
  }

  cancelButton(callbackData: string = 'cancel'): InlineKeyboardButton {
    return { text: '❌ Отмена', callback_data: callbackData };
  }

  formatDate(date: Date): string {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  paginate<T>(array: T[], page: number, pageSize: number = 5): T[] {
    const start = page * pageSize;
    return array.slice(start, start + pageSize);
  }

  paginationButtons(
    currentPage: number,
    totalItems: number,
    pageSize: number,
    callbackPrefix: string,
  ): InlineKeyboardButton[] {
    const totalPages = Math.ceil(totalItems / pageSize);
    const buttons: InlineKeyboardButton[] = [];

    if (currentPage > 0) {
      buttons.push({
        text: '⬅️',
        callback_data: `${callbackPrefix}_page_${currentPage - 1}`,
      });
    }

    buttons.push({
      text: `${currentPage + 1}/${totalPages}`,
      callback_data: 'noop',
    });

    if (currentPage < totalPages - 1) {
      buttons.push({
        text: '➡️',
        callback_data: `${callbackPrefix}_page_${currentPage + 1}`,
      });
    }

    return buttons;
  }
}