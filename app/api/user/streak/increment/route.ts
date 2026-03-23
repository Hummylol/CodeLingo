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
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        let updatedStreak = profile.streak || 0
        let shouldUpdate = false

        if (!profile.last_streak_update) {
            // First time getting a streak
            updatedStreak = profile.streak ? profile.streak + 1 : 1
            shouldUpdate = true
        } else {
            const lastUpdate = new Date(profile.last_streak_update)
            const lastUpdateDay = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate()).getTime()
            
            if (lastUpdateDay < today) {
                // To be realistic, if it's strictly yesterday, we add 1. If older, they lost the streak and we reset to 1.
                // But as requested, just incrementing for now if it's a new day:
                updatedStreak += 1
                shouldUpdate = true
            }
        }

        if (shouldUpdate) {
            console.log("Attempting to update Supabase row:", { updatedStreak, now: now.toISOString(), userId: user.id });
            const { data: updateData, error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    streak: updatedStreak, 
                    last_streak_update: now.toISOString() 
                })
                .eq('id', user.id)
                .select()
                .single()

            if (updateError) {
                console.error('Error updating streak (Could be RLS policy missing for UPDATE):', updateError)
                return NextResponse.json({ error: 'Failed to update streak - Missing UPDATE RLS Policy in Supabase?' }, { status: 500 })
            }
            console.log("Successfully updated Supabase row!", updateData);
        } else {
            console.log("Decided NOT to update Supabase row:", { updatedStreak, lastUpdateDate: profile.last_streak_update, today });
        }

        return NextResponse.json({ streak: updatedStreak, updated: shouldUpdate, last_streak_update: now.toISOString() })
    } catch (error: any) {
        console.error('Streak API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
