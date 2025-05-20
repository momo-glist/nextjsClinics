import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const specialite = await prisma.specialite.findUnique({
      where: { id: params.id },
    })

    if (!specialite) {
      return NextResponse.json({ error: 'Spécialité introuvable' }, { status: 404 })
    }

    if (specialite.cliniqueId !== currentUser.cliniqueId) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    await prisma.specialite.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Spécialité supprimée avec succès' }, { status: 200 })
  } catch (error) {
    console.error('Erreur suppression spécialité :', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}