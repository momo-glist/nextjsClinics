import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const employes = await prisma.user.findMany({
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
