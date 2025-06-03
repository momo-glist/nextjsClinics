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
      where: {
        supabaseUserId: userId,
      },
      select: {
        cliniqueId: true,
      },
    });

    if (!user || !user.cliniqueId) {
      return NextResponse.json(
        { error: "Clinique non trouvée pour l'utilisateur." },
        { status: 404 }
      );
    }

    const cliniqueId = user.cliniqueId;
    const body = await req.json();
    const { ventes, mode } = body;

    if (!cliniqueId || !Array.isArray(ventes) || ventes.length === 0) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const total = ventes.reduce((sum: number, item: any) => {
      return sum + item.quantite * item.prix;
    }, 0);

    const vente = await prisma.$transaction(async (tx) => {
      const venteCree = await tx.vente.create({
        data: {
          cliniqueId,
          date_vente: new Date(),
          total,
          mode,
        },
      });

      for (const ligne of ventes) {
        const { nom, quantite, prix } = ligne;

        // 🔍 Trouver le médicament à partir de son nom
        const catalogue = await tx.catalogueMedicament.findFirst({
          where: {
            nom: nom,
          },
        });

        if (!catalogue) {
          throw new Error(`Médicament '${nom}' introuvable dans le catalogue`);
        }

        const medicament = await tx.medicament.findFirst({
          where: {
            catalogueMedId: catalogue.id,
            cliniqueId,
          },
        });

        if (!medicament) {
          throw new Error(`Médicament '${nom}' non trouvé pour cette clinique`);
        }

        const medicamentId = medicament.id;

        // Création du détail de vente
        await tx.detailVente.create({
          data: {
            quantite,
            prix_unitaire: prix,
            medicamentId,
            venteId: venteCree.id,
          },
        });

        // Décrémenter le stock (FIFO)
        let reste = quantite;

        const lotsDisponibles = await tx.stockLot.findMany({
          where: {
            medicamentId,
            cliniqueId,
            quantite: { gt: 0 },
          },
          orderBy: { date_peremption: "asc" },
        });

        for (const lot of lotsDisponibles) {
          if (reste <= 0) break;

          const quantiteADeduire = Math.min(lot.quantite, reste);

          await tx.stockLot.update({
            where: { id: lot.id },
            data: {
              quantite: lot.quantite - quantiteADeduire,
            },
          });

          reste -= quantiteADeduire;
        }

        if (reste > 0) {
          throw new Error(`Stock insuffisant pour le médicament '${nom}'`);
        }
      }

      return venteCree;
    });

    return NextResponse.json({
      message: "Vente enregistrée avec succès",
      venteId: vente.id,
    });
  } catch (error: any) {
    console.error("[VENTE_POST_ERROR]", error);

    if (
      error.message?.includes("Stock insuffisant") ||
      error.message?.includes("Médicament")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la vente" },
      { status: 500 }
    );
  }
}
