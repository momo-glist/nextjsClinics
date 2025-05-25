import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Params contient l'ID du patient dans l'URL : /api/patients/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Trouver l'utilisateur connecté avec clinique
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseUserId: userId },
          { id: userId }
        ]
      },
      select: {
        cliniqueId: true,
        role: true,
      }
    });

    if (!user || !user.cliniqueId) {
      return NextResponse.json({ error: "Clinique introuvable pour l'utilisateur" }, { status: 400 });
    }

    // Vérifier que le patient appartient à la même clinique
    const patient = await prisma.patient.findFirst({
      where: {
        id: id,
        cliniqueId: user.cliniqueId,
      },
      include: {
        parametresVitaux: true,
        agendas: {
          include: {
            agendaSoins: {
              include: {
                soin: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient non trouvé ou accès interdit" }, { status: 404 });
    }

    return NextResponse.json(patient, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de la récupération du patient :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
