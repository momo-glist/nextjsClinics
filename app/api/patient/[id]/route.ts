import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("Paramètre ID reçu :", params.id);
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
        specialites: { select: { id: true } },
      },
    });

    if (!user?.cliniqueId) {
      return NextResponse.json(
        { error: "Clinique non trouvée" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        cliniqueId: user.cliniqueId,
      },
      include: {
        parametresVitaux: {
          orderBy: { date: "desc" },
          take: 1,
        },
        agendas: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            agendaSoins: {
              include: { soin: true },
            },
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient introuvable" },
        { status: 404 }
      );
    }

    if (user.role === "MEDECIN") {
      const specialiteIds = user.specialites.map((s) => s.id);
      const soinsAutorises = patient.agendas.some((agenda) =>
        agenda.agendaSoins.some((as) =>
          specialiteIds.includes(as.soin.specialiteId)
        )
      );
      if (!soinsAutorises) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    return NextResponse.json(patient, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération patient :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
