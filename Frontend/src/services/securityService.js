import { APIError } from './services.jsx';

const CSRF_TOKEN_HEADER = 'X-CSRF-Token';

class SecurityService {
  private static instance: SecurityService;
  private csrfToken: string | null = null;

  private constructor() {
    // Initialize CSRF token from meta tag if available
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      this.csrfToken = metaTag.getAttribute('content');
    }
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  public getCsrfToken(): string | null {
    return this.csrfToken;
  }

  public async refreshCsrfToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/csrf-token', {
        credentials: 'include' // Important for CSRF protection
      });
      
      if (!response.ok) {
        throw new APIError('Failed to refresh CSRF token');
      }
      
      const data = await response.json();
      this.csrfToken = data.token;
      return this.csrfToken;
    } catch (error) {
      console.error('Error refreshing CSRF token:', error);
      throw error;
    }
  }

  public sanitizeInput(input): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  public validateInput(input, maxLength: number = 255): boolean {
    // Check for common malicious patterns
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /onclick/gi,
      /onload/gi,
      /onerror/gi
    ];

    // Check input length
    if (!input || input.length > maxLength) {
      return false;
    }

    // Check for malicious patterns
    return !maliciousPatterns.some(pattern => pattern.test(input));
  }

  private getEncryptionKey(): Promise<CryptoKey> {
    const key = process.env.REACT_APP_ENCRYPTION_KEY;
    const keyString = key || 'dev-encryption-key-minimum-32-chars-for-aes-256bit-key-secure-token';
    
    // Hash the key to get a consistent 32-byte (256-bit) key
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);
    
    // Use SHA-256 to hash the key to a consistent 32 bytes
    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
      return crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
    });
  }

  public async encryptData(data): Promise<string> {
    try {
      // Use the Web Crypto API for more secure encryption
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Get the encryption key
      const cryptoKey = await this.getEncryptionKey();
      
      // Create an initialization vector
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Perform the encryption
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );

      // Combine IV and encrypted data and encode
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      // Convert to base64 without using spread operator
      let binary = '';
      for (let i = 0; i < combined.length; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  public async decryptData(encrypted): Promise<string> {
    try {
      // Decode the base64 string and separate IV from data
      const combined = new Uint8Array(
        atob(encrypted).split('').map(c => c.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      // Get the encryption key
      const cryptoKey = await this.getEncryptionKey();
      
      // Perform the decryption
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

export const securityService = SecurityService.getInstance();
export { CSRF_TOKEN_HEADER };