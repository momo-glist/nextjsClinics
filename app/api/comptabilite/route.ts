import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { LigneComptaParJour } from "@/app/type";

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
      return NextResponse.json(
        { error: "Utilisateur ou cliniqueId manquant" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mois = searchParams.get("mois");
    const annee = searchParams.get("annee");

    if (!mois || !annee) {
      return NextResponse.json(
        { error: "Paramètres manquants : mois, annee" },
        { status: 400 }
      );
    }

    const cliniqueId = user.cliniqueId;

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

    // Étape 1: récupérer toutes les données individuelles
    const factures = await prisma.facture.findMany({
      where: {
        cliniqueId,
        date: {
          gte: debutMois,
          lte: finMois,
        },
      },
      select: {
        date: true,
        prix: true,
        details: {
          select: {
            soin: {
              select: {
                specialite: {
                  select: {
                    nom: true,
                  },
                },
              },
            },
            prix: true,
          },
        },
      },
    });

    const ventes = await prisma.vente.findMany({
      where: {
        cliniqueId,
        date_vente: {
          gte: debutMois,
          lte: finMois,
        },
      },
      select: {
        date_vente: true,
        total: true,
      },
    });

    const depensesList = await prisma.depense.findMany({
      where: {
        cliniqueId,
        date: {
          gte: debutMois,
          lte: finMois,
        },
      },
      select: {
        libelle: true,
        date: true,
        montant: true,
      },
    });

    // Étape 2: on regroupe tout par date
    type LigneCompta = {
      date: string;
      consultation: number;
      pharmacie: number;
      depenses: { nom: string; montant: number; categorie?: string }[];
      consultations: { montant: number; specialite: string }[]; // ← ici
    };

    const mapParJour: Record<string, LigneCompta> = {};

    for (const f of factures) {
      const d = f.date.toISOString().slice(0, 10);

      if (!mapParJour[d]) {
        mapParJour[d] = {
          date: d,
          consultation: 0,
          pharmacie: 0,
          depenses: [],
          consultations: [],
        };
      }

      mapParJour[d].consultation += f.prix;

      for (const detail of f.details) {
        const specialiteNom = detail.soin?.specialite?.nom ?? "Inconnue";

        mapParJour[d].consultations.push({
          montant: detail.prix,
          specialite: specialiteNom,
        });
      }
    }

    for (const v of ventes) {
      const d = v.date_vente.toISOString().slice(0, 10);
      if (!mapParJour[d])
        mapParJour[d] = {
          date: d,
          consultation: 0,
          pharmacie: 0,
          depenses: [],
          consultations: [], // ✅ à ajouter
        };

      mapParJour[d].pharmacie += v.total;
    }

    for (const dep of depensesList) {
      const d = dep.date.toISOString().slice(0, 10);
      if (!mapParJour[d])
        mapParJour[d] = {
          date: d,
          consultation: 0,
          pharmacie: 0,
          depenses: [],
          consultations: [], // ✅ à ajouter
        };

      mapParJour[d].depenses.push({
        nom: dep.libelle || "Dépense",
        montant: dep.montant,
      });
    }

    // Étape 3: transformer en tableau trié
    const listeComptaParJour = Object.values(mapParJour).sort((a, b) =>
      a.date < b.date ? -1 : 1
    );

    const listeComptaParJourTransformee: LigneComptaParJour[] = [];

    for (const ligne of Object.values(mapParJour)) {
      for (const consultation of ligne.consultations) {
        listeComptaParJourTransformee.push({
          libelle: "Consultation",
          categorie: consultation.specialite,
          montant: consultation.montant,
          date: ligne.date,
        });
      }

      if (ligne.pharmacie > 0) {
        listeComptaParJourTransformee.push({
          libelle: "Pharmacie",
          categorie: "Pharmacie",
          montant: ligne.pharmacie,
          date: ligne.date,
        });
      }

      for (const dep of ligne.depenses) {
        listeComptaParJourTransformee.push({
          libelle: dep.nom,
          categorie: dep.categorie ?? "Autre",
          montant: -dep.montant,
          date: ligne.date,
        });
      }
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
      listeComptaParJour: listeComptaParJourTransformee.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      comptabiliteCreee: !comptabiliteExistante,
    });
  } catch (error) {
    console.error("Erreur API Comptabilite :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
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
    const { libelle, categorie, montant, date } = body;

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
        categorie,
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
