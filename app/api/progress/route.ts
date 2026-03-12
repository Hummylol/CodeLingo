import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const lang = searchParams.get('lang')
        if (!lang) {
            return NextResponse.json({ error: 'Language parameter required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('language', lang)
            .single()

        // If no progress found, initialize to level 1 beginner
        if (error && error.code === 'PGRST116') { // PGRST116 = zero rows returned
            const { data: newData, error: insertError } = await supabase
                .from('user_progress')
                .insert({
                    user_id: user.id,
                    language: lang,
                    unlocked_level: 1,
                    unlocked_difficulty: 'beginner'
                })
                .select()
                .single()

            if (insertError) throw insertError
            data = newData
        } else if (error) {
            throw error
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Progress GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { lang, new_level, new_difficulty } = body

        if (!lang || new_level === undefined || !new_difficulty) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let shouldIncrementStreak = false
        // Determine current level before updating, to check if we leveled up
        const { data: currentProgress } = await supabase
            .from('user_progress')
            .select('unlocked_level')
            .eq('user_id', user.id)
            .eq('language', lang)
            .single()
        
        if (currentProgress && new_level > currentProgress.unlocked_level) {
            shouldIncrementStreak = true
        } else if (!currentProgress) {
            // First time progress
            shouldIncrementStreak = true
        }

        const { data, error } = await supabase
            .from('user_progress')
            .update({
                unlocked_level: new_level,
                unlocked_difficulty: new_difficulty,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('language', lang)
            .select()
            .single()

        if (error) throw error

        if (shouldIncrementStreak) {
            // Self-call the streak increment endpoint we just made with the cookies
            try {
                const cookieStore = request.headers.get('cookie') || ''
                await fetch(new URL('/api/user/streak/increment', request.url), {
                    method: 'POST',
                    headers: { 'cookie': cookieStore }
                })
            } catch (e) {
                console.error("Failed to increment streak inside progress:", e)
            }
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Progress POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
