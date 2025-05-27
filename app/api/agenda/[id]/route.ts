import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // ✅ Ne pas utiliser "await" ici
    const agendaId = params.id;

    const body = await req.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: "Date obligatoire" }, { status: 400 });
    }

    const agenda = await prisma.agenda.update({
      where: { id: agendaId },
      data: {
        date: new Date(date),
      },
    });

    return NextResponse.json(agenda, { status: 200 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === "P2025"
    ) {
      return new Response(JSON.stringify({ error: "Agenda non trouvé" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ error: "Erreur interne", detail: String(error) }),
      { status: 500 }
    );
  }
}

