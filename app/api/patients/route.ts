import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Authentification
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur et sa clinique
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseUserId: userId }, { id: userId }],
      },
      select: {
        cliniqueId: true,
        role: true,
      },
    });

    if (!user || !user.cliniqueId) {
      return NextResponse.json(
        { error: "Clinique non trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    const patients = await prisma.patient.findMany({
      where: {
        cliniqueId: user.cliniqueId,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        age: true,
        telephone: true,
        adresse: true,
        agendas: {
          where: {
            statut: "CONFIRME",
          },
          select: {
            id: true,
            agendaSoins: {
              select: {
                soin: {
                  select: {
                    nom: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });

    const results = patients.map((patient) => {
      const soins = patient.agendas.flatMap((agenda) =>
        agenda.agendaSoins.map((as) => as.soin.nom)
      );

      return {
        id: patient.id,
        nom: patient.nom,
        prenom: patient.prenom,
        age: patient.age,
        telephone: patient.telephone,
        adresse: patient.adresse,
        nombreConsultationsConfirmees: patient.agendas.length,
        soins, 
      };
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des patients:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}