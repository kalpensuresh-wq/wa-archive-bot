import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update';
import { TelegramService } from './telegram.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { BroadcastModule } from '../broadcast/broadcast.module';
import { AccountsScene } from './scenes/accounts.scene';
import { BroadcastScene } from './scenes/broadcast.scene';
import { GroupsScene } from './scenes/groups.scene';

@Module({
  imports: [WhatsAppModule, BroadcastModule],
  providers: [
    TelegramUpdate,
    TelegramService,
    AccountsScene,
    BroadcastScene,
    GroupsScene,
  ],
})
export class TelegramModule {}
