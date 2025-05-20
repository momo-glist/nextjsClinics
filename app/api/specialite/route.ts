import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser || !currentUser.cliniqueId) {
      return NextResponse.json({ error: 'Utilisateur sans clinique' }, { status: 403 })
    }

    const body = await req.json()
    const { nom, description } = body

    if (!nom) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    const specialite = await prisma.specialite.create({
      data: {
        nom,
        description,
        cliniqueId: currentUser.cliniqueId,
      },
    })

    return NextResponse.json(specialite, { status: 201 })
  } catch (error) {
    console.error('Erreur création spécialité :', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser || !currentUser.cliniqueId) {
      return NextResponse.json({ error: 'Utilisateur sans clinique' }, { status: 403 })
    }

    const specialites = await prisma.specialite.findMany({
      where: { cliniqueId: currentUser.cliniqueId },
      orderBy: { nom: 'asc' },
    })

    return NextResponse.json(specialites, { status: 200 })
  } catch (error) {
    console.error('Erreur récupération spécialités :', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser || !currentUser.cliniqueId) {
      return NextResponse.json({ error: 'Utilisateur sans clinique' }, { status: 403 })
    }

    const body = await req.json()
    const { id, nom, description } = body

    if (!id || !nom) {
      return NextResponse.json({ error: 'ID et nom requis' }, { status: 400 })
    }

    // Vérifier que la spécialité appartient bien à la clinique de l'utilisateur
    const specialiteExistante = await prisma.specialite.findUnique({
      where: { id },
    })

    if (!specialiteExistante || specialiteExistante.cliniqueId !== currentUser.cliniqueId) {
      return NextResponse.json({ error: 'Spécialité introuvable ou non autorisée' }, { status: 404 })
    }

    const specialiteModifiee = await prisma.specialite.update({
      where: { id },
      data: {
        nom,
        description,
      },
    })

    return NextResponse.json(specialiteModifiee, { status: 200 })
  } catch (error) {
    console.error('Erreur modification spécialité :', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}