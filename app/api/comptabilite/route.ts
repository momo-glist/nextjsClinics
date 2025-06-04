import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
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

    if (!user || !user.cliniqueId) {
      return NextResponse.json({ error: "Utilisateur ou cliniqueId manquant" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const mois = searchParams.get("mois");
    const annee = searchParams.get("annee");
    const cliniqueId = searchParams.get("cliniqueId");

    if (!mois || !annee || !cliniqueId) {
      return NextResponse.json({ error: "Paramètres manquants : mois, annee, cliniqueId" }, { status: 400 });
    }

    const moisInt = parseInt(mois);
    const anneeInt = parseInt(annee);

    const debutMois = new Date(anneeInt, moisInt - 1, 1);
    const finMois = new Date(anneeInt, moisInt, 0, 23, 59, 59, 999);

    const totalFactures = await prisma.facture.aggregate({
      where: {
        cliniqueId,
        date: {
          gte: debutMois,
          lte: finMois,
        },
      },
      _sum: { prix: true },
    });

    const totalVentes = await prisma.vente.aggregate({
      where: {
        cliniqueId,
        date_vente: {
          gte: debutMois,
          lte: finMois,
        },
      },
      _sum: { total: true },
    });

    const totalDepenses = await prisma.depense.aggregate({
      where: {
        cliniqueId,
        date: {
          gte: debutMois,
          lte: finMois,
        },
      },
      _sum: { montant: true },
    });

    const revenuConsultations = totalFactures._sum.prix || 0;
    const revenuPharmacie = totalVentes._sum.total || 0;
    const depenses = totalDepenses._sum.montant || 0;

    const totalRevenus = revenuConsultations + revenuPharmacie;
    const soldeNet = totalRevenus - depenses;

    // Vérifie s'il existe déjà une entrée comptable pour ce mois
    const comptabiliteExistante = await prisma.comptabilite.findFirst({
      where: {
        mois: moisInt,
        annee: anneeInt,
        cliniqueId,
      },
    });

    if (!comptabiliteExistante) {
      await prisma.comptabilite.create({
        data: {
          mois: moisInt,
          annee: anneeInt,
          revenu: totalRevenus,
          depense: depenses,
          cliniqueId,
        },
      });
    }

    return NextResponse.json({
      mois: moisInt,
      annee: anneeInt,
      cliniqueId,
      revenuConsultations,
      revenuPharmacie,
      totalRevenus,
      depenses,
      soldeNet,
      comptabiliteCreee: !comptabiliteExistante,
    });
  } catch (error) {
    console.error("Erreur API Comptabilite :", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
      select: { cliniqueId: true },
    });

    if (!user?.cliniqueId) {
      return NextResponse.json(
        { error: "Clinique introuvable pour cet utilisateur." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { libelle, montant, date } = body;

    // Validation
    if (!libelle || !montant) {
      return NextResponse.json(
        { error: "Libellé et montant sont requis." },
        { status: 400 }
      );
    }

    const nouvelleDepense = await prisma.depense.create({
      data: {
        libelle,
        montant: parseFloat(montant),
        date: date ? new Date(date) : new Date(),
        cliniqueId: user.cliniqueId,
      },
    });

    return NextResponse.json(nouvelleDepense, { status: 201 });
  } catch (error) {
    console.error("Erreur création dépense :", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la dépense." },
      { status: 500 }
    );
  }
}

