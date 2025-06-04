import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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
        id: true,
        role: true,
        cliniqueId: true,
      },
    });

    if (!user || user.role !== "MEDECIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const agenda = await prisma.agenda.findUnique({
      where: { id: params.id },
      include: { patient: true },
    });

    if (
      !agenda ||
      !agenda.patient ||
      agenda.patient.cliniqueId !== user.cliniqueId
    ) {
      return NextResponse.json(
        { error: "Agenda ou clinique non autorisé" },
        { status: 403 }
      );
    }

    const { fichier, remarque } = await req.json();

    const updatedAgenda = await prisma.agenda.update({
      where: { id: params.id },
      data: {
        statut: "CONFIRME",
        fichier: fichier || undefined,
      },
    });

    if (remarque?.trim()) {
      await prisma.prescription.create({
        data: {
          agendaId: params.id,
          remarque,
        },
      });
    }

    const soinsAgenda = await prisma.agendaSoin.findMany({
      where: { agendaId: agenda.id },
      include: {
        soin: true,
      },
    });

    const totalPrix = soinsAgenda.reduce((sum, item) => {
      return sum + (item.soin.prix ?? 0);
    }, 0);

    await prisma.facture.create({
      data: {
        patientId: agenda.patient.id,
        cliniqueId: user.cliniqueId!,
        agendaId: agenda.id,
        prix: totalPrix,
        details: {
          create: soinsAgenda.map((item) => ({
            soinId: item.soin.id,
            prix: item.soin.prix ?? 0,
          })),
        },
      },
    });

    return NextResponse.json({
      message: "Agenda confirmé",
      agenda: updatedAgenda,
    });
  } catch (error) {
    console.error("Erreur validation agenda:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
