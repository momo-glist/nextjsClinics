import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable dans la base." },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const patientId = form.get("patientId") as string;
    const soinId = form.get("soinId") as string;
    const prescriptionRaw = form.get("prescription") as string;
    const fichierUrl = form.get("fichier") as string | null;

    if (!patientId || !soinId) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const consultation = await prisma.consultation.create({
      data: {
        date: new Date(),
        patientId,
        userId: existingUser.id,
        soinId,
        fichier: fichierUrl || null,
      },
    });

    await prisma.agenda.updateMany({
      where: {
        patientId: patientId,
      },
      data: {
        statut: "CONFIRME",
      },
    });

    if (prescriptionRaw && prescriptionRaw.trim() !== "") {
      await prisma.prescription.create({
        data: {
          consultationId: consultation.id,
          remarque: prescriptionRaw,
        },
      });
    }

    return NextResponse.json(consultation, { status: 201 });
  } catch (error) {
    console.error("Erreur création consultation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const consultations = await prisma.consultation.findMany({
      where: { userId },
      include: {
        patient: true,
        soin: true,
        parametresVitaux: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(consultations, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération consultations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
