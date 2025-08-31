import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class WhatsAppAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Check for WhatsApp API key
    const apiKey = request.headers['x-api-key'] || request.headers['X-API-Key'];
    if (apiKey) {
      // Only check against WhatsApp API key
      const expectedWhatsAppApiKey = process.env.WHATSAPP_API_KEY || '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';
      if (apiKey === expectedWhatsAppApiKey) {
        return true;
      }
    }
    
    throw new UnauthorizedException('Valid WhatsApp API key is required');
  }
}
