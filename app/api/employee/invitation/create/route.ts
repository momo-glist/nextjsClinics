import { auth } from "@clerk/nextjs/server";
import  prisma  from "@/lib/prisma"; // selon ton alias
import { NextResponse } from "next/server";
import crypto from "crypto";

import { sendInvitationEmail } from "@/lib/email"; // adapte le chemin

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { email, role, nom, telephone, specialiteId, specialiteNom, specialiteDescription } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.cliniqueId) {
      return NextResponse.json(
        { error: "Utilisateur sans clinique associée" },
        { status: 400 }
      );
    }

    let finalSpecialiteId = specialiteId;

    // Si specialiteNom est défini et specialiteId non, on essaie de créer ou récupérer la spécialité
    if (!specialiteId && specialiteNom) {
      // Recherche d'une spécialité existante avec ce nom dans la clinique de l'utilisateur
      let specialite = await prisma.specialite.findFirst({
        where: {
          nom: specialiteNom,
          cliniqueId: user.cliniqueId,
        },
      });

      if (!specialite) {
        // Création de la spécialité si elle n'existe pas
        specialite = await prisma.specialite.create({
          data: {
            nom: specialiteNom,
            description: specialiteDescription || null,
            cliniqueId: user.cliniqueId,
          },
        });
      }

      finalSpecialiteId = specialite.id;
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invitation = await prisma.invitation.create({
      data: {
        email,
        nom,
        telephone,
        role,
        specialiteId: finalSpecialiteId,
        cliniqueId: user.cliniqueId,
        invitedById: user.id,
        token,
      },
    });

    const invitationLink = `http://localhost:3000/invitation/accept?token=${token}`;

    await sendInvitationEmail(email, invitationLink);

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Erreur POST /api/employee/invitation/create", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'invitation" },
      { status: 500 }
    );
  }
}




