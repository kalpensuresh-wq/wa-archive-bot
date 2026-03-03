    const accounts = await this.whatsappService.getAllAccounts();

    let text = '📱 *Аккаунты WhatsApp*\n\n';
    if (accounts.length === 0) {
      text += 'Нет аккаунтов. Нажмите "Добавить".';
    } else {
      accounts.forEach((acc, i) => {
        const emoji = this.telegramService.getAccountStatusEmoji(acc.status);
        text += `${i + 1}. ${emoji} *${acc.name}* (${acc._count.groups} групп)\n`;
      });
    }

    const keyboard = [
      ...accounts.map((acc) => [
        Markup.button.callback(
          `${this.telegramService.getAccountStatusEmoji(acc.status)} ${acc.name}`,
          `account_${acc.id}`,
        ),
      ]),
      [Markup.button.callback('➕ Добавить', 'add_account')],
      [this.telegramService.backButton('main_menu')],
    ];

    const options = {
      parse_mode: 'Markdown' as const,
      reply_markup: { inline_keyboard: keyboard },
    };

    if (edit) {
      await ctx.editMessageText(text, options);
    } else {
      await ctx.reply(text, options);
    }
  }

  private async showAccountDetails(ctx: BotContext, accountId: string) {
    const account = await this.whatsappService.getAccountById(accountId);
    if (!account) {
      await ctx.reply('❌ Аккаунт не найден');
      return;
    }

    const emoji = this.telegramService.getAccountStatusEmoji(account.status);
    const statusText = this.telegramService.getAccountStatusText(account.status);

    let text = `📱 *${account.name}*\n\n`;
    text += `${emoji} ${statusText}\n`;
    text += `📞 ${account.phoneNumber || 'Не определен'}\n`;
    text += `📋 Групп: ${account._count.groups}\n`;

    const keyboard: any[][] = [];

    if (account.status === 'CONNECTED') {
      keyboard.push([Markup.button.callback('🔄 Синхр. группы', `sync_groups_${accountId}`)]);
      keyboard.push([Markup.button.callback('🔌 Отключить', `disconnect_${accountId}`)]);
    } else {
      keyboard.push([Markup.button.callback('🔗 Подключить', `connect_${accountId}`)]);
    }

    keyboard.push([Markup.button.callback('🗑 Удалить', `delete_account_${accountId}`)]);
    keyboard.push([this.telegramService.backButton('accounts_list')]);

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  private async showGroupsList(ctx: BotContext, edit = false) {
    const groups = await this.whatsappService.getAllArchivedGroups();

    let text = '📋 *Архивные группы*\n\n';
    if (groups.length === 0) {
      text += 'Нет групп. Подключите аккаунт и синхронизируйте.';
    } else {
      text += `Всего: ${groups.length}\n\n`;
      groups.slice(0, 15).forEach((g) => {
        const emoji = this.telegramService.getAccountStatusEmoji(g.account.status);
        text += `${emoji} ${g.name}\n`;
      });
      if (groups.length > 15) text += `\n...и еще ${groups.length - 15}`;
    }

    const options = {
      parse_mode: 'Markdown' as const,
      reply_markup: {
        inline_keyboard: [[this.telegramService.backButton('main_menu')]],
      },
    };

    if (edit) {
      await ctx.editMessageText(text, options);
    } else {
      await ctx.reply(text, options);
    }
  }

  private async showBroadcastMenu(ctx: BotContext, edit = false) {
    const text = `📨 *Рассылки*`;

    const keyboard = [
      [Markup.button.callback('➕ Новая', 'new_broadcast')],
      [Markup.button.callback('📋 Список', 'broadcasts_list')],
      [this.telegramService.backButton('main_menu')],
    ];

    const options = {
      parse_mode: 'Markdown' as const,
      reply_markup: { inline_keyboard: keyboard },
    };

    if (edit) {
      await ctx.editMessageText(text, options);
    } else {
      await ctx.reply(text, options);
    }
  }

  private async showBroadcastsList(ctx: BotContext, edit = false) {
    const broadcasts = await this.broadcastService.getAllBroadcasts();

    let text = '📊 *Рассылки*\n\n';
    if (broadcasts.length === 0) {
      text += 'Нет рассылок.';
    } else {
      broadcasts.slice(0, 10).forEach((b, i) => {
        const emoji = this.telegramService.getBroadcastStatusEmoji(b.status);
        text += `${i + 1}. ${emoji} ${b.name}\n`;
      });
    }

    const keyboard = [
      ...broadcasts.slice(0, 10).map((b) => [
        Markup.button.callback(
          `${this.telegramService.getBroadcastStatusEmoji(b.status)} ${b.name}`,
          `broadcast_view_${b.id}`,
        ),
      ]),
      [this.telegramService.backButton('broadcast_menu')],
    ];

    const options = {
      parse_mode: 'Markdown' as const,
      reply_markup: { inline_keyboard: keyboard },
    };

    if (edit) {
      await ctx.editMessageText(text, options);
    } else {
      await ctx.reply(text, options);
    }
  }

  private async showBroadcastDetails(ctx: BotContext, broadcastId: string) {
    const broadcast = await this.broadcastService.getBroadcastById(broadcastId);
    if (!broadcast) {
      await ctx.reply('❌ Не найдено');
      return;
    }

    const stats = await this.broadcastService.getBroadcastStats(broadcastId);
    const emoji = this.telegramService.getBroadcastStatusEmoji(broadcast.status);

    let text = `📨 *${broadcast.name}*\n\n`;
    text += `${emoji} ${this.telegramService.getBroadcastStatusText(broadcast.status)}\n\n`;
    text += `⏳ ${stats.pending} | ✅ ${stats.sent} | ❌ ${stats.failed}\n`;

    const keyboard: any[][] = [];
    if (broadcast.status === 'DRAFT' || broadcast.status === 'PAUSED') {
      keyboard.push([Markup.button.callback('▶️ Запустить', `start_broadcast_${broadcastId}`)]);
    }
    keyboard.push([this.telegramService.backButton('broadcasts_list')]);

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  private async showAccountSelectionForBroadcast(ctx: BotContext) {
    const accounts = await this.whatsappService.getAllAccounts();
    const connected = accounts.filter((a) => a.status === 'CONNECTED');

    if (connected.length === 0) {
      await ctx.reply('❌ Нет подключенных аккаунтов');
      return;
    }

    ctx.session.broadcastData.selectedAccountIds = connected.map((a) => a.id);

    const groups = await this.whatsappService.getAllArchivedGroups();
    const available = groups.filter((g) => connected.some((a) => a.id === g.accountId));

    if (available.length === 0) {
      await ctx.reply('❌ Нет групп');
      return;
    }

    ctx.session.broadcastData.selectedGroupIds = available.map((g) => g.id);

    try {
      const broadcast = await this.broadcastService.createBroadcast({
        name: ctx.session.broadcastData.name,
        text: ctx.session.broadcastData.text,
        mediaUrl: ctx.session.broadcastData.mediaFileId,
        mediaType: ctx.session.broadcastData.mediaType as any,
        accountIds: ctx.session.broadcastData.selectedAccountIds,
        groupIds: ctx.session.broadcastData.selectedGroupIds,
        adminTelegramId: ctx.from.id,
      });

      ctx.session.broadcastData = undefined;

      await ctx.reply(
        `✅ *Рассылка создана!*\n\n📨 ${broadcast.name}\n📋 Групп: ${available.length}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('▶️ Запустить', `start_broadcast_${broadcast.id}`)],
              [Markup.button.callback('📋 К списку', 'broadcasts_list')],
            ],
          },
        },
      );
    } catch (error) {
      await ctx.reply(`❌ Ошибка: ${error.message}`);
    }
  }
}