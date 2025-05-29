import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import  prisma  from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const utilisateur = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseUserId: userId }, { id: userId }],
      },
      select: {
        id: true,
        email: true,
        nom: true,
        image: true,
        telephone: true,
        role: true,
        clinique: true,
        createdClinique: true,
      },
    });

    if (!utilisateur) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(utilisateur);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}