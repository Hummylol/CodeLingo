import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    try {
        const { email, password, username } = await request.json()

        if (!email || !password || !username) {
            return NextResponse.json(
                { error: 'Email, password, and username are required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Sign up the user in Supabase auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    // We can initialize other stuff like XP and level here if needed
                    level: 1,
                    xp: 0,
                },
            },
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        return NextResponse.json(
            { message: 'Registration successful', user: authData.user },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Registration API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
