import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('driver/signup')
  async driverSignup(@Body() body: any) {
    return this.authService.signupDriver(body);
  }

  @Post('hotel/login')
  async hotelStaffLogin(@Body() body: any) {
    return this.authService.loginHotelStaff(body);
  }

  @Post('driver/login')
  async driverLogin(@Body() body: any) {
    return this.authService.loginDriver(body);
  }
}

