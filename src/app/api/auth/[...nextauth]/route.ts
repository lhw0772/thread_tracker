import NextAuth from "next-auth";

const handler = NextAuth({
  debug: true,
  providers: [
    {
      id: "threads",
      name: "Threads",
      type: "oauth",
      authorization: {
        url: "https://www.threads.net/oauth/authorize",
        params: {
          scope: "threads_basic,threads_content_publish,threads_manage_insights",
          response_type: "code",
        },
      },
      token: {
        url: "https://graph.threads.net/oauth/access_token",
        async request({ params, provider }) {
          const response = await fetch("https://graph.threads.net/oauth/access_token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: provider.clientId!,
              client_secret: provider.clientSecret!,
              code: params.code!,
              grant_type: "authorization_code",
              redirect_uri: process.env.THREADS_REDIRECT_URI!,
            }),
          });
          
          const data = await response.json();
          return { tokens: data };
        },
      },
      userinfo: {
        url: "https://graph.threads.net/v1.0/me",
        params: {
          fields: "id,username,name,threads_profile_picture_url,threads_biography"
        },
      },
      clientId: process.env.THREADS_CLIENT_ID!,
      clientSecret: process.env.THREADS_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name || profile.username,
          email: null,
          image: profile.threads_profile_picture_url,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        console.log('JWT callback - OAuth login:', account.provider);
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - creating session');
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };