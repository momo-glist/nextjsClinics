import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { fr } from "date-fns/locale";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(req.url);
    const periode = url.searchParams.get("period") || "tout";

    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (periode) {
      case "semaine":
        startDate = startOfWeek(now, { weekStartsOn: 1, locale: fr });
        endDate = endOfWeek(now, { weekStartsOn: 1, locale: fr });
        break;
      case "mois":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "annee":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
    }

    const dateFilter =
      startDate && endDate ? { gte: startDate, lte: endDate } : undefined;

    // Récupération des ventes et achats sur la période
    const [ventes, achats, faibleStock] = await Promise.all([
      prisma.vente.findMany({
        where: dateFilter ? { date_vente: dateFilter } : {},
        include: {
          detailVentes: {
            include: {
              medicament: {
                include: {
                  catalogueMed: true,
                },
              },
            },
          },
        },
      }),

      prisma.historiqueAchat.findMany({
        where: dateFilter ? { date_achat: dateFilter } : {},
      }),

      // Produits en faible stock (seuil < 10)
      prisma.stockLot.findMany({
        where: {
          quantite: { lte: 10 },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        include: {
          medicament: {
            include: {
              catalogueMed: true,
            },
          },
        },
      }),
    ]);

    // Chiffre d’affaires
    const chiffreDaffaire = ventes.reduce((sum, v) => sum + v.total, 0);

    // Panier moyen
    const panierMoyen = ventes.length > 0 ? chiffreDaffaire / ventes.length : 0;

    // Total des achats
    const totalAchat = achats.reduce(
      (sum, a) => sum + a.quantite * a.prix_unitaire,
      0
    );

    // Nombre de ventes
    const nombreDeVentes = ventes.length;

    // Quantité totale de médicaments vendus
    const totalMedVendus = ventes.reduce((acc, vente) => {
      return acc + vente.detailVentes.reduce((q, d) => q + d.quantite, 0);
    }, 0);

    // Top ventes (déjà présent dans ton code)
    const venteParMedicament: Record<
      string,
      { nom: string; quantite: number }
    > = {};

    ventes.forEach((vente) => {
      vente.detailVentes.forEach((detail) => {
        const id = detail.medicamentId;
        const nom = detail.medicament.catalogueMed.nom;

        if (!venteParMedicament[id]) {
          venteParMedicament[id] = { nom, quantite: detail.quantite };
        } else {
          venteParMedicament[id].quantite += detail.quantite;
        }
      });
    });

    const topVentes = Object.entries(venteParMedicament)
      .map(([id, data]) => ({ medicamentId: id, ...data }))
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 5);

    // Produits en faible stock formatés
    const produitsFaibles = faibleStock.map((s) => ({
      medicamentId: s.medicamentId,
      nom: s.medicament.catalogueMed.nom,
      quantite: s.quantite,
      date_peremption: s.date_peremption,
    }));

    // Évolution des ventes par jour (pour graphique)
    const ventesParDate: Record<string, number> = {};
    ventes.forEach((vente) => {
      let dateKey: string;

      switch (periode) {
        case "annee":
          dateKey = format(vente.date_vente, "MMM", { locale: fr }); // janv, févr, ...
          break;
        case "mois":
          dateKey = format(vente.date_vente, "dd MMM", { locale: fr }); // 01 janv, ...
          break;
        case "semaine":
          dateKey = format(vente.date_vente, "EEEE", { locale: fr }); // lundi, mardi...
          break;
        default:
          dateKey = format(vente.date_vente, "yyyy-MM-dd"); // fallback
      }

      ventesParDate[dateKey] = (ventesParDate[dateKey] || 0) + vente.total;
    });

    const evolutionVentes = Object.entries(ventesParDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Réponse complète
    return NextResponse.json({
      chiffreDaffaire,
      panierMoyen,
      totalAchat,
      nombreDeVentes,
      totalMedVendus,
      topVentes,
      produitsFaibles,
      evolutionVentes,
    });
  } catch (error) {
    console.error("Erreur récupération données dashboard:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
