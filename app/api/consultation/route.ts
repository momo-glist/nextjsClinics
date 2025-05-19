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
    const { patientId, soinId, prescription, fichier } = body

    const consultation = await prisma.consultation.create({
      data: {
        date: new Date(),
        patientId,
        userId,
        soinId,
        prescription,
        fichier,
      },
    })

    return NextResponse.json(consultation, { status: 201 })
  } catch (error) {
    console.error('Erreur création consultation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const consultations = await prisma.consultation.findMany({
      where: { userId },
      include: {
        patient: true,
        soin: true,
        parametresVitaux: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(consultations, { status: 200 })
  } catch (error) {
    console.error('Erreur récupération consultations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
