import { OAuth2Client } from 'google-auth-library';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  email_verified: boolean;
}

export class GoogleService {
  private client: OAuth2Client;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = 'https://karma-tracker.replit.app/auth/callback';
    
    console.log('🔑 GoogleService initialization:', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      clientIdLength: this.clientId ? this.clientId.length : 0,
      clientIdPreview: this.clientId ? this.clientId.substring(0, 20) + '...' : 'NOT_FOUND',
      redirectUri: this.redirectUri
    });
    
    if (!this.clientId) {
      console.warn("GOOGLE_CLIENT_ID not provided, Google authentication will be disabled");
    }
    if (!this.clientSecret) {
      console.warn("GOOGLE_CLIENT_SECRET not provided, some Google features may be limited");
    }
    
    this.client = new OAuth2Client(this.clientId, this.clientSecret, this.redirectUri);
  }

  async verifyIdToken(idToken: string): Promise<GoogleUser | null> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      console.log('🔍 Google token payload:', {
        sub: payload.sub,
        email: payload.email,
        emailLength: payload.email ? payload.email.length : 0,
        emailHasAt: payload.email ? payload.email.includes('@') : false,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name
      });

      return {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        given_name: payload.given_name!,
        family_name: payload.family_name || '',
        picture: payload.picture!,
        locale: payload.locale || 'en',
        email_verified: payload.email_verified || false
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return !!this.clientId;
  }

  getClientId(): string {
    return this.clientId;
  }

  getRedirectUri(): string {
    return this.redirectUri;
  }
}

export const googleService = new GoogleService();