import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WhatsAppSessionManager } from './whatsapp-session.manager';
import { AccountStatus } from '@prisma/client';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionManager: WhatsAppSessionManager,
  ) {}

  async createAccount(name: string) {
    return this.prisma.whatsAppAccount.create({
      data: {
        name,
        status: AccountStatus.DISCONNECTED,
      },
    });
  }

  async getAllAccounts() {
    return this.prisma.whatsAppAccount.findMany({
      include: {
        _count: {
          select: { groups: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAccountById(id: string) {
    return this.prisma.whatsAppAccount.findUnique({
      where: { id },
      include: {
        groups: true,
        _count: {
          select: { groups: true },
        },
      },
    });
  }

  async deleteAccount(id: string) {
    await this.sessionManager.destroySession(id);
    return this.prisma.whatsAppAccount.delete({
      where: { id },
    });
  }

  async connectAccount(
    accountId: string,
    onQR: (qr: string) => void,
    onStatusChange: (status: AccountStatus) => void,
  ) {
    return this.sessionManager.createSession(accountId, onQR, onStatusChange);
  }

  async disconnectAccount(accountId: string) {
    return this.sessionManager.destroySession(accountId);
  }

  async syncGroups(accountId: string) {
    return this.sessionManager.syncArchivedGroups(accountId);
  }

  async getAccountGroups(accountId: string) {
    return this.prisma.whatsAppGroup.findMany({
      where: { accountId },
      orderBy: { name: 'asc' },
    });
  }

  async getAllArchivedGroups() {
    return this.prisma.whatsAppGroup.findMany({
      where: { isArchived: true },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  getAccountStatus(accountId: string): AccountStatus | undefined {
    const client = this.sessionManager.getClient(accountId);
    return client?.status;
  }

  getAccountQR(accountId: string): string | undefined {
    const client = this.sessionManager.getClient(accountId);
    return client?.qrCode;
  }
}