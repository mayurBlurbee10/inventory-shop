import NextAuth from "next-auth";
import OktaProvider from "next-auth/providers/okta";

export default NextAuth({
  providers: [
    OktaProvider({
      clientId: process.env.NEXT_PUBLIC_OKTA_CLIENT_ID,
      issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER,
      checks: ['pkce', 'state'],
      clientSecret: '',
      client: {
        token_endpoint_auth_method: 'none',
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  callbacks: {
    async session({ session, token, user }) {
      console.log('user: ', user)
      console.log('token: ', token)
      console.log('session: ', session)
      session.idToken = token.idToken;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the user is authenticated, redirect to home
      if (url.startsWith(baseUrl)) return `${baseUrl}/home`;
      return baseUrl;
    }
  },
});
