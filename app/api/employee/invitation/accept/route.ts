import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function POST(req: Request) {
  const { token, nom, password, telephone } = await req.json();

  if (!token || !nom || !password) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  // 1. Récupérer l'invitation via le token
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation || invitation.accepted) {
    return NextResponse.json({ error: "Invitation invalide ou déjà utilisée" }, { status: 404 });
  }

  const email = invitation.email;

  // 2. Créer l'utilisateur dans Clerk
  const createdUser = await clerkClient.users.createUser({
    emailAddress: [email],
    password: password,
    firstName: nom,
  });

  // 3. Créer l'utilisateur dans ta base Prisma
  const userData: any = {
    email,
    nom,
    role: invitation.role,
    supabaseUserId: createdUser.id, // ou `clerkId`
    clinique: {
      connect: { id: invitation.cliniqueId },
    },
  };

  // Ajouter téléphone si présent dans l’invitation ou dans la requête
  if (telephone || invitation.telephone) {
    userData.telephone = telephone || invitation.telephone;
  }

  // Ajouter spécialité si présente dans l’invitation
  if (invitation.specialiteId) {
    userData.specialites = {
      connect: { id: invitation.specialiteId }
    };
  }

  const user = await prisma.user.create({
    data: userData,
  });

  // 4. Marquer l’invitation comme acceptée
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { accepted: true },
  });

  return NextResponse.json({ success: true, user });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation || invitation.accepted) {
    return NextResponse.json({ error: 'Invitation invalide ou expirée' }, { status: 404 });
  }

  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    nom: invitation.nom || null,
    telephone: invitation.telephone || null,
    specialiteId: invitation.specialiteId || null,
    cliniqueId: invitation.cliniqueId,
  });
}