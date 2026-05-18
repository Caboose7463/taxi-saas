import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  private async send(to: string, subject: string, html: string) {
    if (!process.env.SMTP_USER) return; // Skip if not configured
    try {
      await this.transporter.sendMail({
        from: `"Transit Pro" <${process.env.SMTP_USER}>`,
        to, subject, html,
      });
    } catch (e) {
      console.warn('Email send failed (non-critical):', e.message);
    }
  }

  async bookingConfirmed(hotelName: string, guestName: string, pickup: string, dropoff: string, fare: number) {
    // Email to hotel staff (simplified - in production use hotel email from DB)
    const html = `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:40px;height:40px;background:#000;border-radius:10px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-weight:bold;font-size:16px">T</span>
          </div>
          <h2 style="margin:0;font-size:20px">Booking Confirmed</h2>
        </div>
        <div style="background:#F5F5F7;border-radius:16px;padding:20px;margin-bottom:20px">
          <p style="margin:0 0 8px;font-size:13px;color:#666">GUEST</p>
          <p style="margin:0;font-weight:600">${guestName || 'Guest'}</p>
        </div>
        <div style="background:#F5F5F7;border-radius:16px;padding:20px;margin-bottom:20px">
          <div style="margin-bottom:12px"><p style="margin:0 0 4px;font-size:12px;color:#666">PICKUP</p><p style="margin:0;font-weight:600">${pickup}</p></div>
          <div><p style="margin:0 0 4px;font-size:12px;color:#666">DROP-OFF</p><p style="margin:0;font-weight:600">${dropoff}</p></div>
        </div>
        <div style="background:#000;border-radius:16px;padding:20px;text-align:center;color:#fff">
          <p style="margin:0 0 4px;font-size:12px;opacity:0.7">FARE</p>
          <p style="margin:0;font-size:28px;font-weight:700">£${fare.toFixed(2)}</p>
          <p style="margin:4px 0 0;font-size:11px;opacity:0.6">Your commission: £${(fare * 0.025).toFixed(2)}</p>
        </div>
        <p style="text-align:center;color:#999;font-size:11px;margin-top:20px">Transit Pro · Hotel Dispatch Platform</p>
      </div>`;
    // In production, get hotel email from DB. For now log only.
    console.log(`[EMAIL] Booking confirmed for ${hotelName}: ${pickup} → ${dropoff} £${fare}`);
    // this.send(hotelEmail, 'Booking Confirmed — Transit Pro', html);
  }

  async driverApproved(driverEmail: string, driverName: string) {
    const html = `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;text-align:center">
        <div style="width:40px;height:40px;background:#22c55e;border-radius:10px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center">
          <span style="color:#fff;font-size:20px">✓</span>
        </div>
        <h2 style="margin:0 0 12px">You're Approved, ${driverName}!</h2>
        <p style="color:#666;font-size:14px;margin-bottom:24px">Your Transit Pro driver account is now active. You can log in and start accepting bookings.</p>
        <a href="${process.env.NEXT_PUBLIC_URL || 'https://frontend-kappa-gray-26.vercel.app'}/driver/login" 
           style="background:#000;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;display:inline-block">
          Log In Now →
        </a>
        <p style="text-align:center;color:#999;font-size:11px;margin-top:24px">Transit Pro · Driver Network</p>
      </div>`;
    await this.send(driverEmail, '🎉 You\'re approved — Transit Pro', html);
    console.log(`[EMAIL] Approval email sent to ${driverEmail}`);
  }

  async notifyDriver(driverEmail: string, driverName: string, pickup: string, dropoff: string, fare: number, passengers: number, miles: number, guestName: string) {
    const payout = (fare * 0.90).toFixed(2);
    const html = `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:48px;height:48px;background:#000;border-radius:12px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-weight:bold;font-size:18px">C</span>
          </div>
          <h2 style="margin:0;font-size:22px;font-weight:700">New Job Available</h2>
          <p style="margin:4px 0 0;color:#666;font-size:13px">Hi ${driverName} — accept quickly!</p>
        </div>
        <div style="background:#F5F5F7;border-radius:16px;padding:20px;margin-bottom:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div style="background:#fff;border-radius:10px;padding:12px;text-align:center">
              <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.5px">Passengers</p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:700">${passengers}</p>
            </div>
            <div style="background:#fff;border-radius:10px;padding:12px;text-align:center">
              <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.5px">Distance</p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:700">${miles?.toFixed(1)} mi</p>
            </div>
          </div>
          ${guestName ? `<p style="margin:0 0 10px;font-size:13px"><strong>Guest:</strong> ${guestName}</p>` : ''}
          <p style="margin:0 0 6px;font-size:13px"><strong>Pickup:</strong> ${pickup}</p>
          <p style="margin:0;font-size:13px"><strong>Drop-off:</strong> ${dropoff}</p>
        </div>
        <div style="background:#000;border-radius:16px;padding:20px;text-align:center;color:#fff;margin-bottom:20px">
          <p style="margin:0 0 4px;font-size:12px;opacity:0.6">YOUR PAYOUT</p>
          <p style="margin:0;font-size:32px;font-weight:700">£${payout}</p>
          <p style="margin:4px 0 0;font-size:11px;opacity:0.5">Total fare: £${fare?.toFixed(2)}</p>
        </div>
        <div style="text-align:center">
          <a href="${process.env.NEXT_PUBLIC_URL || 'https://frontend-kappa-gray-26.vercel.app'}/driver/dashboard"
             style="background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;display:inline-block">
            Open App to Accept
          </a>
        </div>
        <p style="text-align:center;color:#999;font-size:11px;margin-top:20px">Caboose · Driver Network</p>
      </div>`;
    await this.send(driverEmail, `New job: ${pickup} → ${dropoff} · £${payout} payout`, html);
    console.log(`[EMAIL] Job notification sent to driver ${driverEmail}`);
  }
}
