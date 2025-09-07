import { Injectable, Logger } from '@nestjs/common';
import { SourceSystem } from '../../common/types/enums';
import * as fs from 'fs';
import * as path from 'path';
import { VcfService } from '../../vcf/vcf.service';

export interface MobileContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  relationship_type?: string;
}

@Injectable()
export class MobileAdapter {
  private readonly logger = new Logger(MobileAdapter.name);

  constructor(private readonly vcfService: VcfService) {}

  async fetchContacts(): Promise<MobileContact[]> {
    this.logger.log('Fetching contacts from Mobile device');
    
    try {
      // First, try to get the latest uploaded VCF file
      const latestVcfFile = await this.vcfService.getLatestVcfFile();
      
      if (latestVcfFile) {
        this.logger.log(`✅ Using uploaded VCF file: ${latestVcfFile.filename}`);
        const contacts = await this.readFromVCF(latestVcfFile.filePath);
        this.logger.log(`📱 Successfully read ${contacts.length} contacts from uploaded VCF file`);
        return contacts;
      }
      
      // Fallback to checking local file locations
      const possiblePaths = [
        path.join(process.cwd(), 'samples', 'mobile_contact.vcf'),
        path.join(process.cwd(), 'uploads', 'mobile_contact.vcf'),
        path.join(process.cwd(), 'data', 'mobile_contact.vcf'),
      ];
      
      let vcfPath: string | null = null;
      
      // Look for VCF file in any of the possible locations
      for (const testPath of possiblePaths) {
        this.logger.log(`Checking for VCF file at: ${testPath}`);
        if (fs.existsSync(testPath)) {
          vcfPath = testPath;
          this.logger.log(`✅ VCF file found at: ${testPath}`);
          break;
        }
      }
      
      if (!vcfPath) {
        this.logger.warn(`❌ No VCF file found in any of the expected locations:`);
        possiblePaths.forEach(p => this.logger.warn(`  - ${p}`));
        this.logger.warn(`Current working directory: ${process.cwd()}`);
        
        // Provide helpful error message
        throw new Error(
          'No VCF file found for mobile contacts sync. ' +
          'Please upload a .vcf file through the Data Source Manager ' +
          'or place a mobile_contact.vcf file in the samples directory.'
        );
      }
      
      this.logger.log(`📱 Reading contacts from VCF file: ${vcfPath}`);
      const contacts = await this.readFromVCF(vcfPath);
      this.logger.log(`📱 Successfully read ${contacts.length} contacts from VCF file`);
      return contacts;
    } catch (error) {
      this.logger.error(`Failed to fetch mobile contacts:`, error);
      throw error;
    }
  }

  private async readFromVCF(filePath: string): Promise<MobileContact[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      this.logger.log(`VCF file size: ${content.length} characters`);
      
      // Test the parsing logic with your exact VCF format
      this.testParsingLogic();
      
      const vcards = content.split('BEGIN:VCARD').filter(vcard => vcard.trim());
      this.logger.log(`Found ${vcards.length} VCF entries to process`);
      
      if (vcards.length === 0) {
        this.logger.warn('❌ No VCF entries found');
        return [];
      }
      
      // Show first VCF entry for debugging
      const firstVcard = vcards[0];
      this.logger.log(`First VCF entry preview: ${firstVcard.substring(0, 300)}...`);
      
      const contacts = vcards.map((vcard, index) => {
        this.logger.log(`\n--- Processing VCF ${index + 1} ---`);
        
        const lines = vcard.split('\n');
        this.logger.log(`VCF has ${lines.length} lines`);
        
        const contact: MobileContact = {
          id: `mobile_${String(index + 1).padStart(3, '0')}`,
          name: '',
          email: '',
          phone: '',
          company: '',
          relationship_type: 'OTHER',
        };

        // Process each line
        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            this.logger.log(`Line ${lineIndex}: "${trimmedLine}"`);
            
            if (trimmedLine.startsWith('FN:')) {
              contact.name = trimmedLine.substring(3);
              this.logger.log(`✅ Parsed name: "${contact.name}"`);
            } else if (trimmedLine.startsWith('TEL;')) {
              // Extract phone number after the last colon
              const colonIndex = trimmedLine.lastIndexOf(':');
              if (colonIndex !== -1) {
                const telValue = trimmedLine.substring(colonIndex + 1);
                contact.phone = telValue.trim();
                this.logger.log(`✅ Parsed phone: "${contact.phone}" from line: "${trimmedLine}"`);
              } else {
                this.logger.error(`❌ No colon found in TEL line: "${trimmedLine}"`);
              }
            } else if (trimmedLine.startsWith('N:')) {
              // Extract name from N field if FN is not available
              if (!contact.name) {
                const nameParts = trimmedLine.substring(2).split(';').filter(part => part.trim());
                if (nameParts.length > 0) {
                  contact.name = nameParts.join(' ').trim();
                  this.logger.log(`✅ Parsed name from N field: "${contact.name}"`);
                }
              }
            }
          }
        });

        // Log the final contact data
        this.logger.log(`📱 Contact ${index + 1} final: Name="${contact.name}", Phone="${contact.phone}"`);
        
        // Validate that we have at least a name or phone
        if (!contact.name && !contact.phone) {
          this.logger.warn(`⚠️ Contact ${index + 1} has no name or phone - skipping`);
          return null;
        }
        
        return contact;
      });

      // Filter out null contacts and return valid ones
      const validContacts = contacts.filter(contact => contact !== null);
      this.logger.log(`\n🎯 Returning ${validContacts.length} valid contacts out of ${vcards.length} VCF entries`);
      
      // Debug: Show summary of valid contacts
      validContacts.forEach((contact, index) => {
        this.logger.log(`Valid contact ${index + 1}: "${contact.name}" - "${contact.phone}"`);
      });
      
      return validContacts;
      
    } catch (error) {
      this.logger.error('❌ Error reading VCF file:', error);
      throw error;
    }
  }

  async transformToStaging(contacts: MobileContact[]): Promise<any[]> {
    return contacts.map(contact => ({
      rawName: contact.name,
      rawEmail: contact.email,
      rawPhone: contact.phone,
      rawCompany: contact.company,
      relationshipType: contact.relationship_type as any,
      dataOwnerName: 'Mobile Contacts',
      sourceSystem: SourceSystem.MOBILE,
      sourceRecordId: contact.id,
    }));
  }

  private testParsingLogic(): void {
    this.logger.log('🧪 Testing VCF parsing logic...');
    
    // Test with your exact VCF format
    const testLines = [
      'FN:Pranav Bale',
      'TEL;TYPE=CELL;TYPE=PREF:+917499175557',
      'N:Bale;Pranav;;;;'
    ];
    
    testLines.forEach((line, index) => {
      const trimmedLine = line.trim();
      this.logger.log(`Test line ${index}: "${trimmedLine}"`);
      
      if (trimmedLine.startsWith('FN:')) {
        const name = trimmedLine.substring(3);
        this.logger.log(`✅ Test FN parsing: "${name}"`);
             } else if (trimmedLine.startsWith('TEL;')) {
        const colonIndex = trimmedLine.lastIndexOf(':');
        if (colonIndex !== -1) {
          const telValue = trimmedLine.substring(colonIndex + 1);
          this.logger.log(`✅ Test TEL parsing: "${telValue}"`);
        } else {
          this.logger.log(`❌ Test TEL parsing failed: No colon found`);
        }
      } else if (trimmedLine.startsWith('N:')) {
        const nameParts = trimmedLine.substring(2).split(';').filter(part => part.trim());
        if (nameParts.length > 0) {
          const name = nameParts.join(' ').trim();
          this.logger.log(`✅ Test N parsing: "${name}"`);
        }
      }
    });
    
    this.logger.log('🧪 VCF parsing logic test completed');
  }
}
