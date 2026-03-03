import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppSessionManager } from './whatsapp-session.manager';

@Module({
  providers: [WhatsAppService, WhatsAppSessionManager],
  exports: [WhatsAppService, WhatsAppSessionManager],
})
export class WhatsAppModule {}