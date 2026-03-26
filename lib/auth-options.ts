import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { env } from '@/lib/env';

export const authOptions: NextAuthOptions = {
    providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password required');
        }

        try {
          const res = await fetch(`${env.API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Authentication failed');
          }

          const data = await res.json();

          if (!data?.access_token || !data?.refresh_token || !data?.user) {
            throw new Error('Invalid authentication response');
          }

          return {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpires:
              Date.now() + Number(data.access_token_expires_in ?? 0) * 1000,
            refreshTokenExpires:
              Date.now() + Number(data.refresh_token_expires_in ?? 0) * 1000,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/error',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.name = user.username;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.refreshTokenExpires = user.refreshTokenExpires;
      }

      const now = Date.now();
      if (typeof token.accessTokenExpires === 'number' && now < token.accessTokenExpires) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: Session | any; token: any }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.email = token.email;
      session.user.name = token.name;
      session.accessToken = token.accessToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.refreshToken = token.refreshToken;
      session.refreshTokenExpires = token.refreshTokenExpires;
      session.error = token.error;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: env.NEXTAUTH_SECRET,
};

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }

  try {
    const response = await fetch(`${env.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const refreshedTokens = await response.json();

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires:
        Date.now() + Number(refreshedTokens.access_token_expires_in ?? 0) * 1000,
      error: undefined,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}