const fs = require('fs');
const path = require('path');

// Test VCF parsing with your exact format
console.log('🧪 Testing VCF parsing...');

const vcfPath = path.join(__dirname, 'samples', 'mobile_contact.vcf');

if (fs.existsSync(vcfPath)) {
  console.log('✅ VCF file found');
  
  const content = fs.readFileSync(vcfPath, 'utf-8');
  console.log(`📁 File size: ${content.length} characters`);
  
  const vcards = content.split('BEGIN:VCARD').filter(vcard => vcard.trim());
  console.log(`📱 Found ${vcards.length} VCF entries`);
  
  if (vcards.length > 0) {
    const firstVcard = vcards[0];
    const lines = firstVcard.split(/\r?\n/);
    
    console.log('\n📋 First VCF entry lines:');
    lines.forEach((line, index) => {
      console.log(`Line ${index}: "${line.trim()}"`);
    });
    
    // Test parsing logic
    let name = '';
    let phone = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('FN:')) {
        name = trimmedLine.substring(3);
        console.log(`✅ Parsed name: "${name}"`);
      } else if (trimmedLine.startsWith('TEL;')) {
        const colonIndex = trimmedLine.lastIndexOf(':');
        if (colonIndex !== -1) {
          phone = trimmedLine.substring(colonIndex + 1);
          console.log(`✅ Parsed phone: "${phone}" from line: "${trimmedLine}"`);
        } else {
          console.log(`❌ No colon found in TEL line: "${trimmedLine}"`);
        }
      }
    });
    
    console.log(`\n🎯 Final result: Name="${name}", Phone="${phone}"`);
  }
} else {
  console.log('❌ VCF file not found');
}
