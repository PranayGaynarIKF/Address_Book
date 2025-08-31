import { SourceSystem } from '../../apps/api/src/common/types/enums';
import { validateEmail } from './email.utils';
import { validatePhoneNumber } from './phone.utils';

export interface ContactData {
  name: string;
  email?: string;
  mobileE164?: string;
  companyName: string;
  relationshipType?: string;
  sourceSystem: SourceSystem;
}

export function calculateDataQualityScore(data: ContactData): number {
  let score = 0;
  
  // +40 for valid mobile number
  if (data.mobileE164 && validatePhoneNumber(data.mobileE164)) {
    score += 40;
  }
  
  // +20 for valid email
  if (data.email && validateEmail(data.email)) {
    score += 20;
  }
  
  // +15 for company present (not "Unknown")
  if (data.companyName && data.companyName !== 'Unknown') {
    score += 15;
  }
  
  // +15 for relationship present
  if (data.relationshipType) {
    score += 15;
  }
  
  // +10 for trusted source (Zoho/Invoice)
  const trustedSources = process.env.TRUSTED_SOURCES?.split(',') || ['ZOHO', 'INVOICE'];
  if (trustedSources.includes(data.sourceSystem)) {
    score += 10;
  }
  
  // Cap at 100
  return Math.min(score, 100);
}

export function generateDuplicateName(name: string, suffix: string): string {
  return `${name} (${suffix})`;
}

export function findDuplicateSuffix(name: string, existingNames: string[]): string {
  const baseName = name.replace(/\s*\([^)]+\)$/, ''); // Remove existing suffix
  const duplicates = existingNames.filter(n => 
    n === name || n.startsWith(baseName + ' (') && n.endsWith(')')
  );
  
  if (duplicates.length === 0) {
    return name;
  }
  
  // Find the highest number suffix
  let maxNumber = 0;
  duplicates.forEach(dup => {
    const match = dup.match(/\(([^)]+)\)$/);
    if (match) {
      const suffix = match[1];
      const numberMatch = suffix.match(/(\d+)/);
      if (numberMatch) {
        maxNumber = Math.max(maxNumber, parseInt(numberMatch[1]));
      }
    }
  });
  
  return `${baseName} (DUP #${maxNumber + 1})`;
}
