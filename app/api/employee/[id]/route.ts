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

    const personnel = await prisma.user.findFirst({
      where: {
        id: params.id, // ✅ bonne manière de récupérer l'id maintenant
        cliniqueId: user.cliniqueId,
      },
      include: {
        specialites: {
          include: { clinique: true },
        },
      },
    });

    if (!personnel)
      return NextResponse.json(
        { error: "Personnel introuvable" },
        { status: 404 }
      );

    return NextResponse.json(personnel);
  } catch (error) {
    console.error("Erreur GET /api/employee/[id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ✅ PUT: mettre à jour les infos de l'employé
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.cliniqueId)
      return NextResponse.json(
        { error: "Clinique introuvable" },
        { status: 404 }
      );

    const data = await req.json();

    const personnelExist = await prisma.user.findFirst({
      where: {
        id: params.id,
        cliniqueId: user.cliniqueId,
      },
    });

    if (!personnelExist)
      return NextResponse.json(
        { error: "Personnel introuvable" },
        { status: 404 }
      );

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        nom: data.nom,
        role: data.role,
        image: data.image,
        specialites:
          data.role === "MEDECIN"
            ? data.specialiteNom
              ? {
                  set: [],
                  connectOrCreate: [
                    {
                      where: {
                        nom_cliniqueId: {
                          nom: data.specialiteNom,
                          cliniqueId: user.cliniqueId,
                        },
                      },
                      create: {
                        nom: data.specialiteNom,
                        cliniqueId: user.cliniqueId,
                      },
                    },
                  ],
                }
              : {
                  set: [],
                }
            : {
                set: [],
              },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PUT /api/employee/[id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
