import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { nom, prenom, age, telephone, adresse, date, soins } = body;

    if (!soins || !Array.isArray(soins) || soins.length === 0) {
      return NextResponse.json(
        { error: "Veuillez sélectionner au moins un soin." },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur lié au userId de Clerk
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
      select: {
        id: true,
        clinique: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || !user.clinique) {
      return NextResponse.json(
        { error: "Clinique non trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    const now = new Date();
    const scheduledDate = date ? new Date(date) : now;

    // Créer le patient
    const patient = await prisma.patient.create({
      data: {
        nom,
        prenom,
        age,
        telephone,
        adresse,
        cliniqueId: user.clinique.id,
      },
    });

    // Créer l’agenda
    const agenda = await prisma.agenda.create({
      data: {
        date: scheduledDate,
        patientId: patient.id,
        userId: user.id,
        statut: "EN_ATTENTE",
      },
    });

    // Calculer le prix total des soins
    // Calculer les détails des soins avec les prix
    const soinsDetails = await prisma.soin.findMany({
      where: { id: { in: soins } },
      select: {
        id: true,
        prix: true,
      },
    });

    // Calcul total avec gestion de `null`
    const totalPrix = soinsDetails.reduce(
      (sum, soin) => sum + (soin.prix ?? 0),
      0
    );

    // Préparer les détails pour la facture
    const detailsData = soinsDetails.map((soin) => {
      if (soin.prix === null || soin.prix === undefined) {
        throw new Error(`Le soin avec l'ID ${soin.id} n'a pas de prix défini.`);
      }

      return {
        soinId: soin.id,
        prix: soin.prix,
      };
    });

    // Créer la facture avec les détails correctement typés
    const facture = await prisma.facture.create({
      data: {
        patientId: patient.id,
        cliniqueId: user.clinique.id,
        agendaId: agenda.id,
        prix: totalPrix,
        details: {
          create:
            detailsData as Prisma.DetailFactureUncheckedCreateWithoutFactureInput[],
        },
      },
      include: {
        details: true,
      },
    });

    return NextResponse.json({ patient, agenda, facture }, { status: 201 });
  } catch (error) {
    console.error("Erreur création patient:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer la clinique de l'utilisateur connecté
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
      select: { cliniqueId: true },
    });

    if (!user || !user.cliniqueId) {
      return NextResponse.json(
        { error: "Clinique non trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    // Récupérer tous les patients liés à la clinique
    const patients = await prisma.patient.findMany({
      where: {
        cliniqueId: user.cliniqueId,
      },
      include: {
        parametresVitaux: true,
      },
      orderBy: {
        nom: "asc",
      },
    });

    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération patients:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
