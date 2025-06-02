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

    const {
      nom,
      forme,
      dosage_valeur,
      dosage_unite,
      laboratoire,
      code_barre,
      prix,
      quantite,
      prix_unitaire,
      date_peremption,
    } = body;

    if (
      !nom ||
      !forme ||
      !dosage_valeur ||
      !dosage_unite ||
      !laboratoire ||
      !prix ||
      !quantite ||
      !prix_unitaire ||
      !date_peremption
    ) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires ne sont pas fournis." },
        { status: 400 }
      );
    }

    // 1. Vérifier si le médicament existe déjà dans le catalogue
    let catalogue = await prisma.catalogueMedicament.findFirst({
      where: {
        nom,
        forme,
        dosage_valeur,
        dosage_unite,
        laboratoire,
      },
    });

    // 2. S'il n'existe pas, le créer
    if (!catalogue) {
      catalogue = await prisma.catalogueMedicament.create({
        data: {
          nom,
          forme,
          dosage_valeur,
          dosage_unite,
          laboratoire,
          code_barre,
        },
      });
    }

    // 3. Vérifier si ce médicament est déjà enregistré pour cette clinique
    let medicament = await prisma.medicament.findFirst({
      where: {
        cliniqueId,
        catalogueMedId: catalogue.id,
      },
    });

    // 4. S'il n'existe pas, le créer
    if (!medicament) {
      medicament = await prisma.medicament.create({
        data: {
          prix,
          cliniqueId,
          catalogueMedId: catalogue.id,
        },
      });
    }

    // 5. Enregistrer l’achat (HistoriqueAchat)
    await prisma.historiqueAchat.create({
      data: {
        quantite,
        prix_unitaire,
        date_achat: new Date(),
        medicamentId: medicament.id,
        cliniqueId,
      },
    });

    // 6. Ajouter un lot avec date de péremption
    await prisma.stockLot.create({
      data: {
        quantite,
        date_peremption: new Date(date_peremption),
        medicamentId: medicament.id,
        cliniqueId,
      },
    });

    return NextResponse.json(
      { message: "Médicament ajouté avec succès." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[MEDICAMENT_POST_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function GET(req: Request) {
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

    const medicaments = await prisma.medicament.findMany({
      where: {
        cliniqueId: user.cliniqueId,
      },
      include: {
        catalogueMed: true,
        stockLots: true,
      },
    });

    return NextResponse.json(medicaments, { status: 200 });
  } catch (error) {
    console.error("[MEDICAMENT_GET_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
