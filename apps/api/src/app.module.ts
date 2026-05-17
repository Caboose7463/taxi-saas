import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DispatchGateway } from './dispatch.gateway';
import { PrismaService } from './prisma.service';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AppController, BookingController],
  providers: [AppService, DispatchGateway, PrismaService, BookingService],
})
export class AppModule {}
