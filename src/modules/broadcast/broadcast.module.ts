import { Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
