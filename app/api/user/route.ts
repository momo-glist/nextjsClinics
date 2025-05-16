import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = createClient()

  const { clerkUserId, email, nom, role } = body

  const { error } = await supabase.from('User').upsert({
    supabaseUserId: clerkUserId,
    email,
    nom,
    role,
  }, {
    onConflict: 'email',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Utilisateur inséré ou mis à jour' }, { status: 200 })
}
