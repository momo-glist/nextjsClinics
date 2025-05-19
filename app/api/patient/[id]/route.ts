import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Params contient l'ID du patient dans l'URL : /api/patients/[id]
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
      select: { cliniqueId: true },
    })

    if (!user || !user.cliniqueId) {
      return NextResponse.json(
        { error: 'Clinique non trouvée pour cet utilisateur' },
        { status: 400 }
      )
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        cliniqueId: user.cliniqueId, // Sécurité : on vérifie bien que ce patient appartient à cette clinique
      },
      include: {
        parametresVitaux: true, // Tu peux l’enlever si tu ne veux pas ces infos
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })
    }

    return NextResponse.json(patient, { status: 200 })
  } catch (error) {
    console.error('Erreur récupération patient:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
