import { calculateDataQualityScore, findDuplicateSuffix } from './scoring.utils';
import { SourceSystem, RelationshipType } from '../../apps/api/src/common/types/enums';

describe('Scoring Utils', () => {
  describe('calculateDataQualityScore', () => {
    it('should calculate perfect score for complete data', () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        mobileE164: '+919876543210',
        companyName: 'Example Corp',
        relationshipType: RelationshipType.CLIENT,
        sourceSystem: SourceSystem.ZOHO,
      };

      const score = calculateDataQualityScore(contactData);
      // 40 (phone) + 20 (email) + 15 (company) + 15 (relationship) + 10 (trusted source) = 100
      expect(score).toBe(100);
    });

    it('should calculate score without phone number', () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        mobileE164: undefined,
        companyName: 'Example Corp',
        relationshipType: RelationshipType.CLIENT,
        sourceSystem: SourceSystem.ZOHO,
      };

      const score = calculateDataQualityScore(contactData);
      // 20 (email) + 15 (company) + 15 (relationship) + 10 (trusted source) = 60
      expect(score).toBe(60);
    });

    it('should calculate score for untrusted source', () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        mobileE164: '+919876543210',
        companyName: 'Example Corp',
        relationshipType: RelationshipType.CLIENT,
        sourceSystem: SourceSystem.GMAIL,
      };

      const score = calculateDataQualityScore(contactData);
      // 40 (phone) + 20 (email) + 15 (company) + 15 (relationship) = 90
      expect(score).toBe(90);
    });

    it('should cap score at 100', () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        mobileE164: '+919876543210',
        companyName: 'Example Corp',
        relationshipType: RelationshipType.CLIENT,
        sourceSystem: SourceSystem.ZOHO,
      };

      const score = calculateDataQualityScore(contactData);
      expect(score).toBe(100);
    });

    it('should handle unknown company', () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        mobileE164: '+919876543210',
        companyName: 'Unknown',
        relationshipType: RelationshipType.CLIENT,
        sourceSystem: SourceSystem.ZOHO,
      };

      const score = calculateDataQualityScore(contactData);
      // 40 (phone) + 20 (email) + 15 (relationship) + 10 (trusted source) = 85
      expect(score).toBe(85);
    });
  });

  describe('findDuplicateSuffix', () => {
    it('should return original name if no duplicates exist', () => {
      const name = 'John Doe';
      const existingNames = ['Jane Smith', 'Bob Wilson'];
      
      const result = findDuplicateSuffix(name, existingNames);
      expect(result).toBe('John Doe');
    });

    it('should add suffix for first duplicate', () => {
      const name = 'John Doe';
      const existingNames = ['John Doe'];
      
      const result = findDuplicateSuffix(name, existingNames);
      expect(result).toBe('John Doe (DUP #1)');
    });

    it('should increment suffix for multiple duplicates', () => {
      const name = 'John Doe';
      const existingNames = ['John Doe', 'John Doe (DUP #1)', 'John Doe (DUP #2)'];
      
      const result = findDuplicateSuffix(name, existingNames);
      expect(result).toBe('John Doe (DUP #3)');
    });

    it('should handle names with existing suffixes', () => {
      const name = 'John Doe (DUP #1)';
      const existingNames = ['John Doe', 'John Doe (DUP #1)'];
      
      const result = findDuplicateSuffix(name, existingNames);
      expect(result).toBe('John Doe (DUP #2)');
    });
  });
});
