import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegrafModule } from 'nestjs-telegraf';
import { appConfig, telegramConfig, whatsappConfig } from '../config/configuration';
import { DatabaseModule } from './modules/database/database.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { BroadcastModule } from './modules/broadcast/broadcast.module';
import { sessionMiddleware } from './modules/telegram/middlewares/session.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, telegramConfig, whatsappConfig],
    }),
    ScheduleModule.forRoot(),
    TelegrafModule.forRootAsync({
      useFactory: () => ({
        token: process.env.TELEGRAM_BOT_TOKEN,
        middlewares: [sessionMiddleware],
        include: [TelegramModule],
      }),
    }),
    DatabaseModule,
    TelegramModule,
    WhatsAppModule,
    BroadcastModule,
  ],
})
export class AppModule {}