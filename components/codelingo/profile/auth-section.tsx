"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function AuthSection() {
  const { user, isLoading, login, logout } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 bg-slate-300 rounded-full animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading authentication...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="animate-in fade-in-50 duration-500">
        <CardContent className="p-4">
          <form onSubmit={async (e) => {
            e.preventDefault()
            setErrorMsg("")

            if (isSignUp) {
              if (password !== confirmPassword) {
                setErrorMsg("Passwords do not match")
                return
              }
              const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
              })

              if (res.ok) {
                // After successful registration, sign in with credentials
                login('credentials', { email, password })
              } else {
                const data = await res.json()
                setErrorMsg(data.error || "Registration failed")
              }
            } else {
              login('credentials', { email, password })
            }
          }} className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <User className="h-5 w-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {isSignUp ? "Create an account to track your progress" : "Sign in to track your progress"}
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 text-sm text-red-500 bg-red-100/50 dark:bg-red-500/10 rounded-md">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              {isSignUp && (
                <div className="space-y-1">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {isSignUp && (
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password || (isSignUp && (!username || !confirmPassword))}
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => login('google')}
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground pt-2 inline-block">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline font-medium"
                >
                  {isSignUp ? "Sign In" : "Sign up"}
                </button>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-in fade-in-50 duration-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-sm font-semibold">
                {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
