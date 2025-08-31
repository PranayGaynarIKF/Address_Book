import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }
    
    const expectedApiKey = process.env.INGESTION_API_KEY;
    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    
    return true;
  }
}
