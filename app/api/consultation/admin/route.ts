import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // On récupère l'utilisateur pour avoir la cliniqueId
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
      select: { cliniqueId: true },
    })

    if (!user || !user.cliniqueId) {
      return NextResponse.json(
        { error: 'Clinique introuvable pour cet utilisateur' },
        { status: 400 }
      )
    }

    // On récupère tous les utilisateurs liés à la clinique
    const users = await prisma.user.findMany({
      where: { cliniqueId: user.cliniqueId },
      select: { id: true },
    })

    const userIds = users.map(u => u.id)

    // On récupère toutes les consultations faites par ces utilisateurs
    const consultations = await prisma.consultation.findMany({
      where: {
        userId: { in: userIds },
      },
      include: {
        patient: true,
        soin: true,
        parametresVitaux: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(consultations, { status: 200 })
  } catch (error) {
    console.error('Erreur récupération consultations clinique:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
