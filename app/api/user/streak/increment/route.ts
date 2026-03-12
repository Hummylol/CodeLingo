import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch current profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('streak, last_streak_update')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Error fetching profile for streak:', profileError)
            // if profile doesn't exist, we can't update it right now, just fail gracefully
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const now = new Date()
        let updatedStreak = profile.streak || 0
        let shouldUpdate = false

        if (!profile.last_streak_update) {
            // First time getting a streak
            updatedStreak = 1
            shouldUpdate = true
        } else {
            const lastUpdate = new Date(profile.last_streak_update)
            // check if last update was before today
            if (
                lastUpdate.getUTCFullYear() < now.getUTCFullYear() ||
                lastUpdate.getUTCMonth() < now.getUTCMonth() ||
                lastUpdate.getUTCDate() < now.getUTCDate()
            ) {
                updatedStreak += 1
                shouldUpdate = true
            }
        }

        if (shouldUpdate) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    streak: updatedStreak, 
                    last_streak_update: now.toISOString() 
                })
                .eq('id', user.id)

            if (updateError) {
                console.error('Error updating streak:', updateError)
                return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 })
            }
        }

        return NextResponse.json({ streak: updatedStreak, updated: shouldUpdate })
    } catch (error: any) {
        console.error('Streak API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
