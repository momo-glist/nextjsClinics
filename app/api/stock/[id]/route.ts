import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { clinique: true },
    });

    if (!user || !user.cliniqueId)
      return NextResponse.json(
        { error: "Clinique introuvable" },
        { status: 404 }
      );

    // Trouver le médicament dans cette clinique à partir de catalogueMed.id
    const medicament = await prisma.medicament.findFirst({
      where: {
        cliniqueId: user.cliniqueId,
        catalogueMedId: params.id,
      },
      include: {
        catalogueMed: true,
        historiqueAchats: {
          orderBy: { date_achat: "desc" },
          take: 1,
        },
        stockLots: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!medicament) {
      return NextResponse.json(
        { error: "Médicament non trouvé dans cette clinique" },
        { status: 404 }
      );
    }

    const achat = medicament.historiqueAchats[0];
    const lot = medicament.stockLots[0];
    const catalogue = medicament.catalogueMed;

    return NextResponse.json({
      id: catalogue.id,
      nom: catalogue.nom,
      forme: catalogue.forme,
      dosage_valeur: catalogue.dosage_valeur,
      dosage_unite: catalogue.dosage_unite,
      fournisseur: catalogue.laboratoire,
      codeBar: catalogue.code_barre ?? "",
      prixAchat: achat?.prix_unitaire ?? 0,
      prix: medicament.prix,
      quantite: lot?.quantite ?? 0,
      dateAchat: achat?.date_achat.toISOString().slice(0, 10) ?? "",
      datePeremption: lot?.date_peremption.toISOString().slice(0, 10) ?? "",
    });
  } catch (error) {
    console.error("Erreur GET /api/stock/[id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
