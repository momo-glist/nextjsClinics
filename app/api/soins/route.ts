import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { nom, description, prix, specialiteId } = await req.json();

    if (!nom || !specialiteId) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // 1. Créer le soin
    const soin = await prisma.soin.create({
      data: {
        nom,
        description,
        prix,
        specialite: {
          connect: { id: specialiteId },
        },
      },
      include: {
        specialite: true, // 👈 ceci est crucial
      },
    });

    // 2. Trouver tous les utilisateurs liés à la spécialité
    const users = await prisma.user.findMany({
      where: {
        specialites: {
          some: { id: specialiteId },
        },
      },
      select: { id: true },
    });

    if (users.length > 0) {
      // 3. Connecter le soin à tous ces utilisateurs
      await prisma.soin.update({
        where: { id: soin.id },
        data: {
          users: {
            connect: users.map((user) => ({ id: user.id })),
          },
        },
      });
    }

    return NextResponse.json(
      { message: "Soin créé et assigné aux utilisateurs", soin },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création du soin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur et sa clinique
    const currentUser = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseUserId: userId }, { id: userId }],
      },
      select: {
        clinique: true,
        role: true,
      },
    });

    if (!currentUser?.clinique?.id) {
      return NextResponse.json(
        { error: "Clinique introuvable" },
        { status: 403 }
      );
    }

    const soins = await prisma.soin.findMany({
      where: {
        specialite: {
          cliniqueId: currentUser.clinique.id,
        },
      },
      include: {
        specialite: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    // Formater les soins
    const formattedSoins = soins.map((soin) => ({
      id: soin.id,
      nom: soin.nom,
      description: soin.description,
      prix: soin.prix,
      specialite: soin.specialite,
    }));

    console.log(formattedSoins);

    return NextResponse.json(formattedSoins, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération soins:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, nom, description, prix, specialiteId } = await req.json();

    if (!id || !nom || !specialiteId) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // 1. Mettre à jour le soin
    const updatedSoin = await prisma.soin.update({
      where: { id },
      data: {
        nom,
        description,
        prix,
        specialite: {
          connect: { id: specialiteId },
        },
      },
      include: {
        specialite: true, // 👈 ceci est crucial
      },
    });

    // 2. Trouver les utilisateurs liés à la spécialité
    const users = await prisma.user.findMany({
      where: {
        specialites: {
          some: { id: specialiteId },
        },
      },
      select: { id: true },
    });

    // 3. Mettre à jour les utilisateurs liés au soin
    await prisma.soin.update({
      where: { id },
      data: {
        users: {
          set: [], // d’abord retirer tous les anciens utilisateurs
          connect: users.map((user) => ({ id: user.id })),
        },
      },
    });

    return NextResponse.json(
      { message: "Soin mis à jour avec succès", soin: updatedSoin },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur mise à jour du soin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Identifiant du soin requis" },
        { status: 400 }
      );
    }

    // Vérifier si le soin existe
    const existingSoin = await prisma.soin.findUnique({
      where: { id },
    });

    if (!existingSoin) {
      return NextResponse.json({ error: "Soin non trouvé" }, { status: 404 });
    }

    // Supprimer le soin
    await prisma.soin.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Soin supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur suppression du soin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
