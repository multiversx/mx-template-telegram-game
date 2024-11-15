import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TgBotSocketModule } from './endpoints/tg-bot-socket/tg-bot-socket.module';

@Module({
  imports: [TgBotSocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
