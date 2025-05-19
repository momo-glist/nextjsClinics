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
    const { nom, prenom, date_naissance, telephone, adresse } = body;

    // Récupérer l'utilisateur lié au userId de Clerk
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

    const patient = await prisma.patient.create({
      data: {
        nom,
        prenom,
        date_naissance: new Date(date_naissance),
        telephone,
        adresse,
        cliniqueId: user.cliniqueId,
      },
    });

    return NextResponse.json(patient, { status: 201 });
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
