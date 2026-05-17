import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DispatchGateway } from './dispatch.gateway';
import { PrismaService } from './prisma.service';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AppController, BookingController],
  providers: [AppService, DispatchGateway, PrismaService, BookingService],
})
export class AppModule {}
