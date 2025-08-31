const fs = require('fs');
const path = require('path');

console.log('🔍 SUPER Debug VCF parsing...');

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
    
    // Super detailed debug
    let name = '';
    let phone = '';
    
    console.log('\n🔍 SUPER Parsing step by step:');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      console.log(`\n--- Line ${index} ---`);
      console.log(`Raw line: "${line}"`);
      console.log(`Raw line length: ${line.length}`);
      console.log(`Raw line bytes: ${Buffer.from(line).toString('hex')}`);
      console.log(`Trimmed: "${trimmedLine}"`);
      console.log(`Trimmed length: ${trimmedLine.length}`);
      
      if (trimmedLine.startsWith('FN:')) {
        name = trimmedLine.substring(3);
        console.log(`✅ FN detected: "${name}"`);
      } else if (trimmedLine.startsWith('TEL;')) {
        console.log(`📞 TEL detected: "${trimmedLine}"`);
        console.log(`TEL starts with check: ${trimmedLine.startsWith('TEL:')}`);
        console.log(`TEL contains TEL: ${trimmedLine.includes('TEL:')}`);
        
        const colonIndex = trimmedLine.lastIndexOf(':');
        console.log(`Colon index: ${colonIndex}`);
        console.log(`Colon found: ${colonIndex !== -1}`);
        
        if (colonIndex !== -1) {
          const telValue = trimmedLine.substring(colonIndex + 1);
          phone = telValue.trim();
          console.log(`✅ Phone extracted: "${phone}"`);
          console.log(`Phone length: ${phone.length}`);
        } else {
          console.log(`❌ No colon found`);
        }
      } else {
        console.log(`❌ Not FN or TEL`);
      }
    });
    
    console.log(`\n🎯 Final result: Name="${name}", Phone="${phone}"`);
    console.log(`Name length: ${name.length}, Phone length: ${phone.length}`);
    
    // Check if TEL line exists at all
    const telLines = lines.filter(line => line.trim().startsWith('TEL:'));
    console.log(`\n🔍 TEL lines found: ${telLines.length}`);
    telLines.forEach((line, index) => {
      console.log(`TEL line ${index}: "${line.trim()}"`);
    });
  }
} else {
  console.log('❌ VCF file not found');
}
