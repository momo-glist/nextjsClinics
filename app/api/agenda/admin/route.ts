import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer l'utilisateur pour obtenir sa cliniqueId
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

    // Tous les utilisateurs de la clinique
    const users = await prisma.user.findMany({
      where: { cliniqueId: user.cliniqueId },
      select: { id: true },
    })

    const userIds = users.map(u => u.id)

    // Récupérer tous les rendez-vous (agendas) de ces utilisateurs
    const agendas = await prisma.agenda.findMany({
      where: {
        userId: { in: userIds },
      },
      include: {
        patient: true,
        user: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(agendas, { status: 200 })
  } catch (error) {
    console.error('Erreur récupération agendas clinique:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
