import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { BookingService } from './booking.service';
import { Prisma } from '@prisma/client';

@Controller('api/v1/bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('estimate')
  async estimateFare(@Body() body: { pickup: string; dropoff: string }) {
    return this.bookingService.estimateFare(body.pickup, body.dropoff);
  }

  @Post()
  async create(@Body() createBookingDto: Prisma.BookingUncheckedCreateInput) {
    return this.bookingService.createBooking(createBookingDto);
  }

  @Get('active')
  async getActive() {
    return this.bookingService.getActiveBookings();
  }

  @Patch(':id/accept')
  async acceptBooking(@Param('id') id: string, @Body('driverId') driverId: string) {
    return this.bookingService.acceptBooking(id, driverId);
  }
}
