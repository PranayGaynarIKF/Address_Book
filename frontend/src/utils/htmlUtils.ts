// Utility functions for handling HTML content from rich text editors

/**
 * Strip HTML tags from content to get plain text
 * @param html - HTML content string
 * @returns Plain text content
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  // Create a temporary div element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get text content and clean up whitespace
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Convert HTML content to display-friendly format
 * Handles line breaks and basic formatting
 * @param html - HTML content string
 * @returns Formatted text for display
 */
export const formatHtmlForDisplay = (html: string): string => {
  if (!html) return '';
  
  // First handle escaped newlines
  let formatted = html
    .replace(/\\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '');
  
  // Strip remaining HTML tags
  return stripHtmlTags(formatted);
};

/**
 * Convert content to HTML for display with proper line breaks
 * @param content - Content string (may contain \n or \\n)
 * @returns HTML string with proper line breaks
 */
export const formatContentForHtmlDisplay = (content: string): string => {
  if (!content) return '';
  
  // First, handle escaped newlines and convert to actual newlines
  let formatted = content
    .replace(/\\n/g, '\n')
    .replace(/\n/g, '\n');
  
  // Then convert newlines to HTML line breaks
  return formatted
    .replace(/\n/g, '<br>');
};

/**
 * Convert content with literal \n to proper HTML display
 * @param content - Content string with literal \n characters
 * @returns HTML string with proper line breaks
 */
export const formatLiteralNewlinesToHtml = (content: string): string => {
  if (!content) return '';
  
  // Convert literal \n to actual newlines, then to HTML breaks
  return content
    .replace(/\\n/g, '\n')
    .replace(/\n/g, '<br>');
};

/**
 * Convert plain text content to proper mail format with line breaks
 * @param content - Plain text content
 * @returns Formatted content with proper line breaks
 */
export const formatPlainTextToMailFormat = (content: string): string => {
  if (!content) return '';
  
  // Handle escaped newlines first
  let formatted = content.replace(/\\n/g, '\n');
  
  // If content doesn't have newlines, try to add them at logical points
  if (!formatted.includes('\n')) {
    // Add line breaks after common email patterns - more comprehensive patterns
    formatted = formatted
      // Greetings
      .replace(/Dear \{\{name\}\},/g, 'Dear {{name}},\n')
      .replace(/Hi \{\{name\}\},/g, 'Hi {{name}},\n')
      .replace(/Hello \{\{name\}\},/g, 'Hello {{name}},\n')
      
      // Announcements and updates
      .replace(/We are thrilled to announce/g, '\nWe are thrilled to announce')
      .replace(/We are excited to announce/g, '\nWe are excited to announce')
      .replace(/We are pleased to announce/g, '\nWe are pleased to announce')
      .replace(/We have some exciting updates/g, '\nWe have some exciting updates')
      .replace(/We are excited to have/g, '\nWe are excited to have')
      .replace(/We are pleased to/g, '\nWe are pleased to')
      .replace(/We would like to/g, '\nWe would like to')
      .replace(/We hope you/g, '\nWe hope you')
      .replace(/We look forward to/g, '\nWe look forward to')
      
      // Product and service mentions
      .replace(/our new product:/g, 'our new product:\n')
      .replace(/new product: \{\{productName\}\}!/g, 'new product: {{productName}}!\n')
      .replace(/Get early access/g, '\n\nGet early access')
      .replace(/Get exclusive access/g, '\n\nGet exclusive access')
      .replace(/Don't miss out/g, '\n\nDon\'t miss out')
      .replace(/Limited time offer/g, '\n\nLimited time offer')
      
      // Variable placeholders
      .replace(/\{\{content\}\}/g, '{{content}}\n\n')
      .replace(/\{\{description\}\}/g, '{{description}}\n\n')
      .replace(/\{\{productName\}\}/g, '{{productName}}')
      .replace(/\{\{name\}\}/g, '{{name}}')
      .replace(/\{\{company\}\}/g, '{{company}}')
      .replace(/\{\{phone\}\}/g, '{{phone}}')
      
      // Closings
      .replace(/Thank you for being/g, '\n\nThank you for being')
      .replace(/Thank you for your/g, '\n\nThank you for your')
      .replace(/Best regards,/g, '\n\nBest regards,')
      .replace(/Sincerely,/g, '\n\nSincerely,')
      .replace(/Regards,/g, '\n\nRegards,')
      .replace(/Best wishes/g, '\n\nBest wishes')
      .replace(/Kind regards/g, '\n\nKind regards')
      .replace(/The Team/g, '\nThe Team')
      .replace(/Best,/g, '\n\nBest,')
      .replace(/Thanks,/g, '\n\nThanks,')
      
      // Clean up multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n');
  }
  
  return formatted;
};

/**
 * Check if content contains HTML tags
 * @param content - Content string to check
 * @returns True if content contains HTML tags
 */
export const containsHtml = (content: string): boolean => {
  if (!content) return false;
  return /<[^>]*>/g.test(content);
};

/**
 * Truncate HTML content for preview
 * @param html - HTML content string
 * @param maxLength - Maximum length for preview
 * @returns Truncated HTML content
 */
export const truncateHtml = (html: string, maxLength: number = 100): string => {
  if (!html) return '';
  
  const plainText = stripHtmlTags(html);
  if (plainText.length <= maxLength) return html;
  
  // Find a good breaking point
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const breakPoint = lastSpace > maxLength * 0.8 ? lastSpace : maxLength;
  
  return plainText.substring(0, breakPoint) + '...';
};
