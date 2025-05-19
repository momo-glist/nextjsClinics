import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { patientId, temperature, tension, poids } = body

    const parametres = await prisma.parametresVitaux.create({
      data: {
        patientId,
        temperature,
        tension,
        poids,
        date: new Date(),
      },
    })

    return NextResponse.json(parametres, { status: 201 })
  } catch (error) {
    console.error('Erreur création paramètres vitaux:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
