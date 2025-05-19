// app/api/personnel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPersonnel, deletePersonnel, getPersonnels } from "@/app/action";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
  }

  const user = await clerkClient.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;

  if (!email) {
    return NextResponse.json({ message: "Email non trouvé" }, { status: 400 });
  }

  try {
    const personnels = await getPersonnels(email);
    return NextResponse.json(personnels, { status: 200 });
  } catch (error: any) {
    console.error("Erreur API GET :", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
  }

  // Récupérer l'email de l'utilisateur Clerk connecté
  const user = await clerkClient.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;

  if (!email) {
    return NextResponse.json({ message: "Email introuvable pour l'utilisateur" }, { status: 400 });
  }

  const body = await req.json();

  try {
    const personnel = await createPersonnel(body, email); // 👈 maintenant via l'email
    return NextResponse.json(personnel, { status: 200 });
  } catch (error: any) {
    console.error("Erreur API POST :", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}



