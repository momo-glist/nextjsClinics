import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseUserId: userId }, { id: userId }],
      },
      select: {
        cliniqueId: true,
        role: true,
        specialites: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || !user.cliniqueId) {
      return NextResponse.json(
        { error: "Clinique non trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    const employes = await prisma.user.findMany({
      where: {
        cliniqueId: user.cliniqueId,
        role: {
          not: "ADMIN",
        },
      },
      include: {
        specialites: true,
        clinique: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(employes);
  } catch (error) {
    console.error("Erreur lors de la récupération des employés :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}