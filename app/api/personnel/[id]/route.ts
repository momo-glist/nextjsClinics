import { deletePersonnel, getPersonnelById, updatePersonnel } from "@/app/action";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id;

    const body = await request.json();
    const { utilisateurEmail } = body;

    if (!utilisateurEmail) {
      return NextResponse.json({ success: false, message: "Email utilisateur requis." }, { status: 400 });
    }

    const result = await deletePersonnel(id, utilisateurEmail);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur dans le handler DELETE:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personnelId = params.id;

    // Récupérer les query params de l'URL
    const url = new URL(request.url);
    const utilisateurEmail = url.searchParams.get("email");

    if (!utilisateurEmail) {
      return NextResponse.json(
        { success: false, message: "Email utilisateur requis." },
        { status: 400 }
      );
    }

    const personnel = await getPersonnelById(personnelId, utilisateurEmail);
    return NextResponse.json({ success: true, personnel });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


export async function PUT(req: NextRequest) {
  try {
    // Authentification avec Clerk
    const { userId } = getAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Non autorisé." }, { status: 401 });
    }

    // Lecture des données du corps de la requête
    const body = await req.json();

    const email = body.personnelEmail;
    if (!email) {
      return NextResponse.json({ success: false, message: "Email requis." }, { status: 400 });
    }

    const result = await updatePersonnel(body, email);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur PUT /api/personnel :", error);
    return NextResponse.json({ success: false, message: error.message || "Erreur serveur" }, { status: 500 });
  }
}