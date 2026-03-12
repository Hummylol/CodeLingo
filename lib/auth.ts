import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !data.user) {
          console.error("Supabase auth error:", error?.message)
          return null
        }

        return {
          id: data.user.id,
          name: data.user.user_metadata?.username || data.user.email?.split('@')[0],
          email: data.user.email,
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + data.user.email
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session }) {
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
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)
