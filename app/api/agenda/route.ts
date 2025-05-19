import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { patientId, date, statut } = body

    const agenda = await prisma.agenda.create({
      data: {
        date: new Date(date),
        patientId,
        userId,
        statut,
      },
    })

    return NextResponse.json(agenda, { status: 201 })
  } catch (error) {
    console.error('Erreur création rendez-vous:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const agendas = await prisma.agenda.findMany({
      where: { userId },
      include: {
        patient: true,
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(agendas, { status: 200 })
  } catch (error) {
    console.error('Erreur récupération agendas:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}