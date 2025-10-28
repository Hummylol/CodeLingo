import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Return the session data as-is since we use email as ID
      return session
    },
    async jwt({ token, user }) {
      // Store user data in token
      if (user) {
        token.name = user.name
        token.email = user.email
        token.picture = user.image
      }
      return token
    },
  },
  pages: {
    signIn: '/profile',
  },
  session: {
    strategy: 'jwt' as const,
  },
  debug: true, // Enable debug mode to see what's happening
}

export default NextAuth(authOptions)
