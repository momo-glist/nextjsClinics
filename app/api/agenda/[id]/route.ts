import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const agendaId = params.id
    const body = await req.json()
    const { date, statut } = body

    const agenda = await prisma.agenda.update({
      where: { id: agendaId },
      data: {
        ...(date && { date: new Date(date) }),
        ...(statut && { statut }),
      },
    })

    return NextResponse.json(agenda, { status: 200 })
  } catch (error) {
    console.error('Erreur mise à jour agenda:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


