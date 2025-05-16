import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { ModuleNom, Role } from "@prisma/client"; // Import de l'enum

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    let { nom, adresse, telephone, email, modules } = body;

    // Normalise les modules en majuscules (pour correspondre à ModuleNom)
    modules = modules.map((mod: string) => mod.toUpperCase());

    // Vérifie que les modules sont valides
    const invalidModules = modules.filter((mod: string) => !(mod in ModuleNom));

    if (invalidModules.length > 0) {
      return NextResponse.json(
        { error: `Modules invalides : ${invalidModules.join(", ")}` },
        { status: 400 }
      );
    }

    // Vérifie si une clinique existe déjà pour cet utilisateur
    const existing = await prisma.clinique.findUnique({
      where: { utilisateurId: userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Une clinique existe déjà pour cet utilisateur." },
        { status: 400 }
      );
    }

    // Vérifie si l'utilisateur administrateur existe déjà
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          nom: "", // adapter selon besoin
          role: Role.ADMIN, // ou "ADMIN"
        },
      });
    }

    // création clinique liée à administrateur
    const clinique = await prisma.clinique.create({
      data: {
        nom,
        adresse,
        telephone,
        utilisateurId: user.id,
        modules: {
          create: modules.map((mod: string) => ({
            nom: mod as ModuleNom,
          })),
        },
      },
    });

    // mettre à jour l'utilisateur : il appartient au personnel de la clinique (relation UserToClinique)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        cliniqueId: clinique.id,
      },
    });

    return NextResponse.json(clinique);
  } catch (error: any) {
    console.error("Erreur API /clinic", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de la clinique." },
      { status: 500 }
    );
  }
}
