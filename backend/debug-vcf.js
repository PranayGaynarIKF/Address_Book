const fs = require('fs');
const path = require('path');

console.log('🔍 Debug VCF parsing...');

const vcfPath = path.join(__dirname, 'samples', 'mobile_contact.vcf');

if (fs.existsSync(vcfPath)) {
  console.log('✅ VCF file found');
  
  const content = fs.readFileSync(vcfPath, 'utf-8');
  const vcards = content.split('BEGIN:VCARD').filter(vcard => vcard.trim());
  
  if (vcards.length > 0) {
    const firstVcard = vcards[0];
    const lines = firstVcard.split(/\r?\n/);
    
    console.log('\n📋 First VCF entry lines:');
    lines.forEach((line, index) => {
      console.log(`Line ${index}: "${line.trim()}"`);
    });
    
    // Debug parsing step by step
    let name = '';
    let phone = '';
    
    console.log('\n🔍 Parsing step by step:');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      console.log(`\n--- Line ${index} ---`);
      console.log(`Raw line: "${line}"`);
      console.log(`Trimmed: "${trimmedLine}"`);
      
      if (trimmedLine.startsWith('FN:')) {
        name = trimmedLine.substring(3);
        console.log(`✅ FN detected: "${name}"`);
      } else if (trimmedLine.startsWith('TEL:')) {
        console.log(`📞 TEL detected: "${trimmedLine}"`);
        const colonIndex = trimmedLine.lastIndexOf(':');
        console.log(`Colon index: ${colonIndex}`);
        
        if (colonIndex !== -1) {
          const telValue = trimmedLine.substring(colonIndex + 1);
          phone = telValue.trim();
          console.log(`✅ Phone extracted: "${phone}"`);
        } else {
          console.log(`❌ No colon found`);
        }
      }
    });
    
    console.log(`\n🎯 Final result: Name="${name}", Phone="${phone}"`);
    console.log(`Name length: ${name.length}, Phone length: ${phone.length}`);
  }
} else {
  console.log('❌ VCF file not found');
}
