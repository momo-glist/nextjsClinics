import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import  prisma  from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

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

export async function GET() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: "Email non trouvé" }, { status: 400 });
  }

  const utilisateur = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { clinique: true, createdClinique: true },
  });

  if (!utilisateur) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  return NextResponse.json(utilisateur);
}
