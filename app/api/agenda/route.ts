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
      select: {
        id: true,
        cliniqueId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    if (!user.cliniqueId) {
      return NextResponse.json(
        { error: "cliniqueId manquant pour l'utilisateur." },
        { status: 400 }
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

      // Récupérer les soins associés à l'ancien agenda
      const soinsAgenda = await prisma.agendaSoin.findMany({
        where: { agendaId: ancienAgenda.id },
        include: {
          soin: true,
        },
      });

      if (soinsAgenda.length > 0) {
        const totalPrix = soinsAgenda.reduce((sum, item) => {
          return sum + (item.soin.prix ?? 0); // gestion du prix potentiellement null
        }, 0);

        const detailsData = soinsAgenda.map((item) => ({
          soinId: item.soin.id,
          prix: item.soin.prix ?? 0,
        }));

        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
        });

        if (!patient) {
          return NextResponse.json(
            { error: "Patient non trouvé" },
            { status: 404 }
          );
        }

        const facture = await prisma.facture.create({
          data: {
            patientId: patient.id,
            cliniqueId: user.cliniqueId,
            agendaId: ancienAgenda.id,
            prix: totalPrix,
            details: {
              create: detailsData,
            },
          },
        });
      }
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

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get("date");

    if (!dateString) {
      return NextResponse.json({ error: "Date manquante" }, { status: 400 });
    }

    const selectedDay = new Date(dateString);
    const start = new Date(selectedDay.setHours(0, 0, 0, 0));
    const end = new Date(selectedDay.setHours(23, 59, 59, 999));

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseUserId: userId }, { id: userId }],
      },
      select: {
        id: true,
        cliniqueId: true,
      },
    });

    if (!user?.cliniqueId) {
      return NextResponse.json({ error: "Clinique non trouvée" }, { status: 404 });
    }

    const agendas = await prisma.agenda.findMany({
      where: {
        user: {
          cliniqueId: user.cliniqueId,
        },
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        date: true,
      },
    });

    return NextResponse.json({
      times: agendas.map((a) => a.date),
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}