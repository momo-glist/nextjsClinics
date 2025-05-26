import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { supabaseUserId: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const form = await req.formData();
    const patientId = form.get("patientId") as string;
    const dateString = form.get("date") as string;
    const soinsString = form.get("soins") as string;

    if (!patientId || !dateString) {
      return NextResponse.json(
        { error: "patientId ou date manquant." },
        { status: 400 }
      );
    }

    const date = new Date(dateString);
    const soinsIds: string[] = soinsString ? JSON.parse(soinsString) : [];

    const ancienAgenda = await prisma.agenda.findFirst({
      where: {
        patientId,
        statut: "EN_ATTENTE",
      },
      orderBy: {
        date: "desc",
      },
    });

    if (ancienAgenda) {
      await prisma.agenda.update({
        where: { id: ancienAgenda.id },
        data: { statut: "CONFIRME" },
      });
    }

    const nouveauAgenda = await prisma.agenda.create({
      data: {
        date,
        patientId,
        userId : user.id,
        statut: "EN_ATTENTE",
      },
    });

    // Lien avec les soins
    if (soinsIds.length > 0) {
      await prisma.agendaSoin.createMany({
        data: soinsIds.map((soinId) => ({
          agendaId: nouveauAgenda.id,
          soinId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(nouveauAgenda, { status: 201 });
  } catch (error) {
    console.error("Erreur création rendez-vous:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const agendas = await prisma.agenda.findMany({
      where: { userId },
      include: {
        patient: true,
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(agendas, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération agendas:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
