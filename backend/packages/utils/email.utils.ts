export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function extractCompanyFromEmail(email: string): string {
  if (!email || !validateEmail(email)) {
    return 'Unknown';
  }
  
  const domain = email.split('@')[1];
  if (!domain) {
    return 'Unknown';
  }
  
  // Remove common TLDs and get company name
  const company = domain.split('.')[0];
  return company.charAt(0).toUpperCase() + company.slice(1);
}

export function normalizeCompanyName(company: string): string {
  if (!company || typeof company !== 'string') {
    return 'Unknown';
  }
  
  const trimmed = company.trim();
  if (!trimmed) {
    return 'Unknown';
  }
  
  return trimmed;
}
