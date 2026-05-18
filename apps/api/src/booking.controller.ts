import { Controller, Post, Body, Get, Param, Patch, Headers, UnauthorizedException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtService } from '@nestjs/jwt';

@Controller('api/v1/bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly jwtService: JwtService,
  ) {}

  private extractHotelId(authHeader: string | undefined): string {
    if (!authHeader) throw new UnauthorizedException('No token provided');
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = this.jwtService.verify(token) as any;
      if (!payload.hotelId) throw new UnauthorizedException('Not a hotel account');
      return payload.hotelId;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('estimate')
  async estimateFare(@Body() body: { pickup: string; dropoff: string }) {
    return this.bookingService.estimateFare(body.pickup, body.dropoff);
  }

  @Post()
  async create(
    @Body() body: {
      pickupAddress: string;
      dropoffAddress: string;
      fare: number;
      hotelCommission: number;
      driverPayout?: number;
      guestName?: string;
      guestPhone?: string;
      notes?: string;
      scheduledFor?: string;
    },
    @Headers('authorization') auth: string,
  ) {
    const hotelId = this.extractHotelId(auth);
    return this.bookingService.createBooking({
      hotelId,
      pickupAddress: body.pickupAddress,
      dropoffAddress: body.dropoffAddress,
      fare: Number(body.fare),
      hotelCommission: Number(body.hotelCommission),
      driverPayout: Number(body.driverPayout || 0),
      guestName: body.guestName || '',
      guestPhone: body.guestPhone || '',
      notes: body.notes || '',
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
    });
  }

  @Get('active')
  async getActive() {
    return this.bookingService.getActiveBookings();
  }

  @Get('hotel')
  async getHotelBookings(@Headers('authorization') auth: string) {
    const hotelId = this.extractHotelId(auth);
    return this.bookingService.getHotelBookings(hotelId);
  }

  @Patch(':id/accept')
  async acceptBooking(
    @Param('id') id: string,
    @Body('driverId') driverId: string,
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    let resolvedDriverId = driverId;
    if (!resolvedDriverId && token) {
      try {
        const payload = this.jwtService.verify(token) as any;
        resolvedDriverId = payload.sub;
      } catch {}
    }
    return this.bookingService.acceptBooking(id, resolvedDriverId || 'unknown');
  }
}
