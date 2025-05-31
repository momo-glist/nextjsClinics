import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Récupération des données au format JSON
    const body = await req.json();
    const { patientId, date, soins, fichier } = body;

    if (!patientId || !date) {
      return NextResponse.json(
        { error: "patientId ou date manquant." },
        { status: 400 }
      );
    }

    const soinsIds: string[] = Array.isArray(soins) ? soins : [];

    // Mise à jour de l'ancien agenda s'il existe
    const ancienAgenda = await prisma.agenda.findFirst({
      where: {
        patientId,
        statut: "EN_ATTENTE",
      },
      orderBy: {
        date: "desc",
      },
    });

    if (ancienAgenda) {
      await prisma.agenda.update({
        where: { id: ancienAgenda.id },
        data: { statut: "CONFIRME" },
      });
    }

    // Création du nouvel agenda
    const nouveauAgenda = await prisma.agenda.create({
      data: {
        date: new Date(date),
        patientId,
        userId: user.id,
        statut: "EN_ATTENTE",
        fichier: fichier || null,
      },
    });

    if (soinsIds.length > 0) {
      await prisma.agendaSoin.createMany({
        data: soinsIds.map((soinId) => ({
          agendaId: nouveauAgenda.id,
          soinId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(nouveauAgenda, { status: 201 });
  } catch (error) {
    console.error("Erreur création rendez-vous:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const agendas = await prisma.agenda.findMany({
      where: { userId },
      include: {
        patient: true,
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(agendas, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération agendas:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
