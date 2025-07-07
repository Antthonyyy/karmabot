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

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("GOOGLE_CLIENT_ID not provided, Google authentication will be disabled");
    }
    this.client = new OAuth2Client(clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleUser | null> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

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
    return !!process.env.GOOGLE_CLIENT_ID;
  }
}

export const googleService = new GoogleService();