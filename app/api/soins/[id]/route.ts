import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
      include: { clinique: true },
    });

    if (!currentUser || !currentUser.cliniqueId) {
      return NextResponse.json(
        { error: "Utilisateur non lié à une clinique" },
        { status: 403 }
      );
    }

    const soin = await prisma.soin.findUnique({
      where: { id: params.id },
      include: {
        specialite: true,
      },
    });

    if (!soin) {
      return NextResponse.json({ error: "Soin introuvable" }, { status: 404 });
    }

    if (soin.specialite.cliniqueId !== currentUser.cliniqueId) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const consultationsCount = await prisma.consultation.count({
      where: { soinId: params.id },
    });

    if (consultationsCount > 0) {
      return NextResponse.json(
        { error: "Ce soin est lié à des consultations" },
        { status: 400 }
      );
    }

    await prisma.soin.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Soin supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur suppression soin :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}