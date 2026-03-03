  getConnectedClients(): WhatsAppClient[] {
    return Array.from(this.clients.values()).filter(
      (c) => c.status === AccountStatus.CONNECTED,
    );
  }

  async syncArchivedGroups(accountId: string): Promise<number> {
    const waClient = this.clients.get(accountId);
    if (!waClient || waClient.status !== AccountStatus.CONNECTED) {
      throw new Error('Client not connected');
    }

    const chats = await waClient.client.getChats();
    const archivedGroups = chats.filter(
      (chat) => chat.isGroup && chat.archived,
    );

    this.logger.log(
      `Found ${archivedGroups.length} archived groups for account ${accountId}`,
    );

    let syncedCount = 0;

    for (const group of archivedGroups) {
      try {
        await this.prisma.whatsAppGroup.upsert({
          where: {
            waId_accountId: {
              waId: group.id._serialized,
              accountId,
            },
          },
          update: {
            name: group.name,
            isArchived: true,
          },
          create: {
            waId: group.id._serialized,
            name: group.name,
            isArchived: true,
            accountId,
          },
        });
        syncedCount++;
      } catch (error) {
        this.logger.error(`Error syncing group ${group.name}:`, error);
      }
    }

    return syncedCount;
  }

  async sendMessageWithMedia(
    accountId: string,
    groupWaId: string,
    text: string,
    mediaPath?: string,
  ): Promise<void> {
    const waClient = this.clients.get(accountId);
    if (!waClient || waClient.status !== AccountStatus.CONNECTED) {
      throw new Error('Client not connected');
    }

    let media: MessageMedia | undefined;
    if (mediaPath) {
      if (mediaPath.startsWith('http')) {
        media = await MessageMedia.fromUrl(mediaPath);
      } else if (fs.existsSync(mediaPath)) {
        media = MessageMedia.fromFilePath(mediaPath);
      }
    }

    if (media) {
      await waClient.client.sendMessage(groupWaId, media, { caption: text });
    } else {
      await waClient.client.sendMessage(groupWaId, text);
    }
  }

  private async updateAccountStatus(
    accountId: string,
    status: AccountStatus,
  ): Promise<void> {
    try {
      await this.prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: {
          status,
          lastActivity: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error updating account status:`, error);
    }
  }

  async reconnectSavedAccounts(): Promise<void> {
    const accounts = await this.prisma.whatsAppAccount.findMany({
      where: {
        status: {
          in: [AccountStatus.CONNECTED, AccountStatus.DISCONNECTED],
        },
      },
    });

    for (const account of accounts) {
      try {
        this.logger.log(`Attempting to reconnect account: ${account.name}`);
        await this.createSession(
          account.id,
          () => {},
          () => {},
        );
      } catch (error) {
        this.logger.error(`Failed to reconnect account ${account.name}:`, error);
      }
    }
  }
}