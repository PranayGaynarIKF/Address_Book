import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery,
  ApiSecurity 
} from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppAuthGuard } from '../common/guards/whatsapp-auth.guard';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
  
  @IsOptional()
  @IsString()
  type?: 'text' | 'template';
  
  @IsOptional()
  @IsString()
  templateName?: string;
  
  @IsOptional()
  templateParams?: Record<string, string>;
}

export class BulkMessageDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactIds?: string[];
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
  
  @IsString()
  @IsNotEmpty()
  message: string;
  
  @IsOptional()
  @IsString()
  type?: 'text' | 'template';
  
  @IsOptional()
  @IsString()
  templateName?: string;
  
  @IsOptional()
  templateParams?: Record<string, string>;
}

export class TemplateContextDto {
  @IsString()
  @IsNotEmpty()
  template_name: string;
  
  @IsString()
  @IsNotEmpty()
  language: string;
  
  @IsNotEmpty()
  body: Record<string, any>;
}

export class TextContextDto {
  @IsString()
  @IsNotEmpty()
  body: string;
  
  @IsOptional()
  preview_url?: boolean;
}

export class TemplateDataDto {
  @IsString()
  @IsNotEmpty()
  type: string;
  
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TemplateContextDto)
  context: TemplateContextDto;
}

export class TextDataDto {
  @IsString()
  @IsNotEmpty()
  type: string;
  
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TextContextDto)
  context: TextContextDto;
}

export class WhatsAppTemplateDto {
  @IsString()
  @IsNotEmpty()
  phone_number_id: string;
  
  @IsString()
  @IsNotEmpty()
  customer_country_code: string;
  
  @IsString()
  @IsNotEmpty()
  customer_number: string;
  
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TemplateDataDto)
  data: TemplateDataDto;
  
  @IsOptional()
  reply_to?: any;
  
  @IsOptional()
  @IsString()
  myop_ref_id?: string;
}

export class WhatsAppTextMessageDto {
  @IsString()
  @IsNotEmpty()
  phone_number_id: string;
  
  @IsString()
  @IsNotEmpty()
  customer_country_code: string;
  
  @IsString()
  @IsNotEmpty()
  customer_number: string;
  
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TextDataDto)
  data: TextDataDto;
  
  @IsOptional()
  reply_to?: any;
  
  @IsOptional()
  @IsString()
  myop_ref_id?: string;
}

@ApiTags('WhatsApp')
@Controller('whatsapp')
@UseGuards(WhatsAppAuthGuard)
@ApiSecurity('whatsapp-api-key')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('send/:contactId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send WhatsApp message to a single contact',
    description: 'Sends a WhatsApp message to the specified contact using their phone number'
  })
  @ApiParam({ 
    name: 'contactId', 
    description: 'ID of the contact to send message to',
    example: 'cme9p0aqr01ctb3wcmkiwo0nq'
  })
  @ApiBody({ 
    type: SendMessageDto,
    description: 'Message details',
    examples: {
      simple: {
        summary: 'Simple text message',
        value: {
          message: 'Hello! How are you doing today?'
        }
      },
      template: {
        summary: 'Template message',
        value: {
          message: 'Welcome to our service!',
          type: 'template',
          templateName: 'welcome_message',
          templateParams: {
            customer_name: 'John Doe'
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Message sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: 'msg_123456789' },
        status: { type: 'string', example: 'sent' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid contact or message data' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Contact not found' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error or WhatsApp API error' 
  })
  async sendMessage(
    @Param('contactId') contactId: string,
    @Body() body: SendMessageDto
  ) {
    console.log('🚀 DEBUG: Controller - sendMessage called');
    console.log('🚀 DEBUG: Contact ID:', contactId);
    console.log('🚀 DEBUG: Request Body:', JSON.stringify(body, null, 2));
    
    try {
      // Validate required fields
      if (!body.message || !body.message.trim()) {
        console.log('❌ ERROR: Missing or empty message in request body');
        return {
          success: false,
          error: 'Message is required and cannot be empty'
        };
      }
      
      console.log('✅ DEBUG: All required fields present, calling service...');
      
      // Pass the message type to the service (default to 'text' if not specified)
      const messageType = body.type || 'text';
      const result = await this.whatsappService.sendMessage(contactId, body.message.trim(), messageType);
      
      console.log('✅ DEBUG: Service call completed, result:', result);
      return result;
      
    } catch (error) {
      console.log('❌ ERROR: Controller error:', error.message);
      return {
        success: false,
        error: `Controller error: ${error.message}`
      };
    }
  }

  @Get('contacts/by-tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get contacts by tags for WhatsApp messaging',
    description: 'Retrieves all contacts that have the specified tags for bulk messaging'
  })
  @ApiQuery({ 
    name: 'tagIds', 
    description: 'Comma-separated list of tag IDs',
    required: true,
    type: String,
    example: 'tag1,tag2,tag3'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contacts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        contacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              mobileE164: { type: 'string' },
              email: { type: 'string' },
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    color: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        total: { type: 'number', example: 25 }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid tag IDs' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async getContactsByTags(@Query('tagIds') tagIds: string) {
    const tagIdArray = tagIds.split(',').map(id => id.trim());
    return this.whatsappService.getContactsByTags(tagIdArray);
  }

  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send WhatsApp message to multiple contacts or by tags',
    description: 'Sends the same WhatsApp message to multiple contacts. Can select contacts individually or by tags.'
  })
  @ApiBody({ 
    type: BulkMessageDto,
    description: 'Bulk message details - can use contactIds OR tagIds',
    examples: {
      byContacts: {
        summary: 'Send to specific contacts',
        value: {
          contactIds: ['contact1', 'contact2', 'contact3'],
          message: 'Important announcement: Our office will be closed tomorrow.'
        }
      },
      byTags: {
        summary: 'Send to all contacts with specific tags',
        value: {
          tagIds: ['tag1', 'tag2'],
          message: 'Special offer for our valued customers!'
        }
      },
      combined: {
        summary: 'Send to both specific contacts and tagged contacts',
        value: {
          contactIds: ['contact1'],
          tagIds: ['tag1'],
          message: 'Combined message for specific and tagged contacts.'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk messages processed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        totalContacts: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              messageId: { type: 'string' },
              status: { type: 'string' },
              error: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async sendBulkMessage(@Body() body: BulkMessageDto) {
    return this.whatsappService.sendBulkMessageEnhanced(body);
  }

  @Get('status/:messageId')
  @ApiOperation({ 
    summary: 'Get WhatsApp message status',
    description: 'Retrieves the current status of a sent WhatsApp message'
  })
  @ApiParam({ 
    name: 'messageId', 
    description: 'ID of the message to check status for',
    example: 'msg_123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Message status retrieved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: 'msg_123456789' },
        status: { type: 'string', example: 'delivered' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Message not found' 
  })
  async getMessageStatus(@Param('messageId') messageId: string) {
    return this.whatsappService.getMessageStatus(messageId);
  }

  @Get('history/:contactId')
  @ApiOperation({ 
    summary: 'Get WhatsApp message history for a contact',
    description: 'Retrieves the message history between your business and a specific contact'
  })
  @ApiParam({ 
    name: 'contactId', 
    description: 'ID of the contact to get history for',
    example: 'cme9p0aqr01ctb3wcmkiwo0nq'
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Maximum number of messages to return',
    required: false,
    type: Number,
    example: 50
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Message history retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          message: { type: 'string' },
          status: { type: 'string' },
          sentAt: { type: 'string', format: 'date-time' },
          contact: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phone: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async getMessageHistory(
    @Param('contactId') contactId: string,
    @Query('limit') limit: number = 50
  ) {
    return this.whatsappService.getMessageHistory(contactId, limit);
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get WhatsApp messaging statistics',
    description: 'Retrieves overall statistics about WhatsApp messages sent through your business'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        sent: { type: 'number', example: 120 },
        failed: { type: 'number', example: 10 },
        delivered: { type: 'number', example: 110 },
        successRate: { type: 'string', example: '93.33' }
      }
    }
  })
  async getStatistics() {
    return this.whatsappService.getStatistics();
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'WhatsApp service health check',
    description: 'Checks if the WhatsApp service is properly configured and ready'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        config: {
          type: 'object',
          properties: {
            hasApiKey: { type: 'boolean', example: true },
            hasBaseUrl: { type: 'boolean', example: true },
            hasPhoneNumber: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  async healthCheck() {
    // Get service configuration status
    const config = this.whatsappService.getConfigurationStatus();
    
    // Determine overall health status
    const isHealthy = config.hasApiKey && config.hasBaseUrl && config.hasPhoneNumber;
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      config,
      message: isHealthy 
        ? 'WhatsApp service is properly configured' 
        : 'WhatsApp service has configuration issues. Check your .env file.',
      recommendations: isHealthy ? [] : [
        'Create a .env file in the apps/api directory',
        'Add WHATSAPP_API_KEY, WHATSAPP_BASE_URL, WHATSAPP_COMPANY_ID, and WHATSAPP_PHONE_NUMBER',
        'Restart your server after creating the .env file'
      ]
    };
  }

  @Post('send-template/:contactId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send WhatsApp template message to a contact',
    description: 'Sends a WhatsApp template message to the specified contact using WhatsApp Business API template format'
  })
  @ApiParam({ 
    name: 'contactId', 
    description: 'ID of the contact to send template message to',
    example: 'cme9p0aqr01ctb3wcmkiwo0nq'
  })
  @ApiBody({ 
    type: WhatsAppTemplateDto,
    description: 'WhatsApp template message details in WhatsApp Business API template format',
    examples: {
      customMarketing: {
        summary: 'Custom Marketing Template (Approved)',
        value: {
          phone_number_id: "690875100784871",
          customer_country_code: "91",
          customer_number: "9307768467",
          data: {
            type: "template",
            context: {
              template_name: "Custom Marketing", // Use the exact approved template name
              language: "en",
              body: {
                Pushkar: "Pranay" // Use the exact parameter name from the approved template
              }
            }
          },
          reply_to: null,
          myop_ref_id: "unique_reference_123"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template message sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: 'msg_123456' },
        status: { type: 'string', example: 'sent' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid contact or template data'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error'
  })
  async sendTemplateMessage(
    @Param('contactId') contactId: string,
    @Body() body: WhatsAppTemplateDto
  ) {
    console.log('🚀🚀🚀 DEBUG: Controller - sendTemplateMessage called');
    console.log('🚀🚀🚀 DEBUG: Contact ID:', contactId);
    console.log('🚀🚀🚀 DEBUG: Request Body:', JSON.stringify(body, null, 2));
    
    try {
      // Validate required fields for template
      if (!body.data?.context?.template_name) {
        console.log('❌ ERROR: Missing template_name in request body');
        return {
          success: false,
          error: 'Missing template_name in request body'
        };
      }
      
      if (!body.customer_number) {
        console.log('❌ ERROR: Missing customer_number in request body');
        return {
          success: false,
          error: 'Missing customer_number in request body'
        };
      }
      
      console.log('🚀🚀🚀 DEBUG: All required fields present, calling template service...');
      
      // Extract template information from the request body
      const templateName = body.data.context.template_name;
      const templateParams = body.data.context.body || {};
      const customerPhoneNumber = body.customer_number;
      
      console.log('🚀🚀🚀 DEBUG: Template details:', { templateName, templateParams, customerPhoneNumber });
      
      // Use the proper template service method
      const result = await this.whatsappService.sendTemplateMessage(
        contactId, 
        templateName, 
        templateParams, 
        customerPhoneNumber
      );
      
      console.log('✅ DEBUG: Template service call completed, result:', result);
      return result;
      
    } catch (error) {
      console.log('❌ ERROR: Controller error:', error.message);
      return {
        success: false,
        error: `Template message failed: ${error.message}`
      };
    }
  }

  @Post('send-whatsapp-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send WhatsApp template message using WhatsApp Business API format',
    description: 'Sends a WhatsApp template message using the complete WhatsApp Business API request structure'
  })
  @ApiBody({ 
    type: WhatsAppTemplateDto,
    description: 'Complete WhatsApp template message request in WhatsApp Business API format',
    examples: {
      basic: {
        summary: 'Basic template message',
        value: {
          phone_number_id: "690875100784871",
          customer_country_code: "91",
          customer_number: "9307768467",
          data: {
            type: "template",
            context: {
              template_name: "Pushkar",
              language: "en",
              body: {
                name: "Pranay"
              }
            }
          },
          reply_to: null,
          myop_ref_id: "unique_reference_123"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template message sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: 'msg_123456' },
        status: { type: 'string', example: 'sent' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid template data'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error'
  })
  async sendWhatsAppTemplate(@Body() body: WhatsAppTemplateDto) {
    // Enhanced debugging for the controller
    console.log('🔍 DEBUG: Controller - sendWhatsAppTemplate called');
    console.log('Request Body:', JSON.stringify(body, null, 2));
    
    try {
      // Validate required fields
      if (!body.data?.context?.template_name) {
        console.log('❌ ERROR: Missing template_name in request body');
        return {
          success: false,
          error: 'Missing template_name in request body'
        };
      }
      
      if (!body.customer_number) {
        console.log('❌ ERROR: Missing customer_number in request body');
        return {
          success: false,
          error: 'Missing customer_number in request body'
        };
      }
      
      console.log('✅ DEBUG: All required fields present, calling service...');
      
      // Use a system contact ID since this endpoint doesn't require a specific contact
      const systemContactId = 'system_template_message';
      
      // Pass the full WhatsApp template data to the service, including the phone number
      const result = await this.whatsappService.sendTemplateMessage(
        systemContactId,
        body.data.context.template_name,
        body.data.context.body,
        body.customer_number // Pass the phone number from request body
      );
      
      console.log('✅ DEBUG: Service call completed, result:', result);
      return result;
      
    } catch (error) {
      console.log('❌ ERROR: Controller error:', error.message);
      return {
        success: false,
        error: `Controller error: ${error.message}`
      };
    }
  }

  @Post('send-text-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send WhatsApp text message using direct API format',
    description: 'Sends a WhatsApp text message using the exact format that works in Postman'
  })
  @ApiBody({ 
    type: WhatsAppTextMessageDto,
    description: 'WhatsApp text message request in the working Postman format',
    examples: {
      textMessage: {
        summary: 'Text message (working format)',
        value: {
          phone_number_id: "690875100784871",
          customer_country_code: "91",
          customer_number: "9307768467",
          data: {
            type: "text",
            context: {
              body: "Hi pranay!, How are you?",
              preview_url: false
            }
          },
          reply_to: null,
          myop_ref_id: "<<unique value>>"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Text message sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: '2f30809b-57cc-4858-bc90-cf83b48247b5' },
        status: { type: 'string', example: 'sent' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid message data'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error'
  })
  async sendTextMessage(@Body() body: WhatsAppTextMessageDto) {
    console.log('🔍 DEBUG: Controller - sendTextMessage called');
    console.log('Request Body:', JSON.stringify(body, null, 2));
    
    try {
      // Validate required fields
      if (!body.data?.context?.body) {
        console.log('❌ ERROR: Missing message body in request');
        return {
          success: false,
          error: 'Missing message body in request'
        };
      }
      
      if (!body.customer_number) {
        console.log('❌ ERROR: Missing customer_number in request body');
        return {
          success: false,
          error: 'Missing customer_number in request body'
        };
      }
      
      console.log('✅ DEBUG: All required fields present, calling service...');
      
      // Call the service method that handles the direct API format
      const result = await this.whatsappService.sendDirectTextMessage(body);
      
      console.log('✅ DEBUG: Service call completed, result:', result);
      return result;
      
    } catch (error) {
      console.log('❌ ERROR: Controller error:', error.message);
      return {
        success: false,
        error: `Controller error: ${error.message}`
      };
    }
  }


}
