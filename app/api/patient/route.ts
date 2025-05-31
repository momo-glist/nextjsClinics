import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { nom, prenom, age, telephone, adresse, date, soins } = body;

    if (!soins || !Array.isArray(soins) || soins.length === 0) {
      return NextResponse.json(
        { error: "Veuillez sélectionner au moins un soin." },
        { status: 400 }
      );
    }

    for (const soin of soins) {
      if (!soin.id || typeof soin.prix !== "number") {
        return NextResponse.json(
          {
            error:
              "Chaque soin doit contenir un id et un prix numérique valide.",
          },
          { status: 400 }
        );
      }
    }

    const existingSoins = await prisma.soin.findMany({
      where: {
        id: { in: soins.map((s: any) => s.id) },
      },
      select: { id: true },
    });

    const existingIds = existingSoins.map((s) => s.id);
    const invalidIds = soins.filter((s: any) => !existingIds.includes(s.id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: `Soins inexistants: ${invalidIds.map((s: any) => s.id).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
      select: {
        id: true,
        clinique: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            adresse: true,
            statut: true,
            utilisateurId: true,
          },
        },
      },
    });

    if (!user || !user.clinique) {
      return NextResponse.json(
        { error: "Clinique non trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    const now = new Date();
    const scheduledDate = date ? new Date(date) : now;

    const patient = await prisma.patient.create({
      data: {
        nom,
        prenom,
        age,
        telephone,
        adresse,
        cliniqueId: user.clinique.id,
      },
    });

    const agenda = await prisma.agenda.create({
      data: {
        date: scheduledDate,
        patientId: patient.id,
        userId: user.id,
        statut: "EN_ATTENTE",
      },
    });
    await prisma.agendaSoin.createMany({
      data: soins.map((soin: any) => ({
        agendaId: agenda.id,
        soinId: soin.id,
      })),
    });

    const totalPrix = soins.reduce(
      (sum: number, soin: any) => sum + soin.prix,
      0
    );

    const detailsData = soins.map((soin: any) => ({
      soinId: soin.id,
      prix: soin.prix,
    }));

    const facture = await prisma.facture.create({
      data: {
        patientId: patient.id,
        cliniqueId: user.clinique.id,
        agendaId: agenda.id,
        prix: totalPrix,
        details: {
          create:
            detailsData as Prisma.DetailFactureUncheckedCreateWithoutFactureInput[],
        },
      },
      include: {
        details: true,
      },
    });

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Erreur création patient:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupération des paramètres de dates
    const searchParams = req.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Les paramètres de date 'start' et 'end' sont requis." },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Récupération de l'utilisateur
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseUserId: userId }, { id: userId }],
      },
      select: {
        cliniqueId: true,
        role: true,
        specialites: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || !user.cliniqueId) {
      return NextResponse.json(
        { error: "Clinique non trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    let patients;

    if (
      user.role === "ADMIN" ||
      user.role === "INFIRMIER" ||
      user.role === "ADMINISTRATIF"
    ) {
      // Récupération pour les rôles administratif
      patients = await prisma.patient.findMany({
        where: {
          cliniqueId: user.cliniqueId,
          agendas: {
            some: {
              statut: "EN_ATTENTE",
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        orderBy: {
          nom: "asc",
        },
        include: {
          parametresVitaux: true,
          agendas: {
            where: {
              statut: "EN_ATTENTE",
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            include: {
              agendaSoins: {
                include: {
                  soin: true,
                },
              },
            },
          },
        },
      });
    } else if (user.role === "MEDECIN") {
      const specialiteIds = user.specialites.map((s) => s.id);

      patients = await prisma.patient.findMany({
        where: {
          cliniqueId: user.cliniqueId,
          agendas: {
            some: {
              statut: "EN_ATTENTE",
              date: {
                gte: startDate,
                lte: endDate,
              },
              agendaSoins: {
                some: {
                  soin: {
                    specialiteId: {
                      in: specialiteIds,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          nom: "asc",
        },
        include: {
          parametresVitaux: true,
          agendas: {
            where: {
              statut: "EN_ATTENTE",
              date: {
                gte: startDate,
                lte: endDate,
              },
              agendaSoins: {
                some: {
                  soin: {
                    specialiteId: {
                      in: specialiteIds,
                    },
                  },
                },
              },
            },
            include: {
              agendaSoins: {
                include: {
                  soin: true,
                },
              },
            },
          },
        },
      });
    } else {
      return NextResponse.json(
        { error: "Rôle non autorisé à voir les patients." },
        { status: 403 }
      );
    }

    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération patients avec agendas en attente:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { patientId, nom, prenom, age, telephone, adresse, soins } = body;

    if (!patientId) {
      return NextResponse.json({ error: "patientId requis" }, { status: 400 });
    }

    if (!soins || !Array.isArray(soins) || soins.length === 0) {
      return NextResponse.json(
        { error: "Veuillez sélectionner au moins un soin." },
        { status: 400 }
      );
    }

    for (const soin of soins) {
      if (!soin.id || typeof soin.prix !== "number") {
        return NextResponse.json(
          { error: "Chaque soin doit avoir un id et un prix valide." },
          { status: 400 }
        );
      }
    }

    const existingSoins = await prisma.soin.findMany({
      where: { id: { in: soins.map((s: any) => s.id) } },
      select: { id: true },
    });

    const existingIds = existingSoins.map((s) => s.id);
    const invalidIds = soins.filter((s: any) => !existingIds.includes(s.id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: `Soins inexistants: ${invalidIds.map((s: any) => s.id).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { clinique: true },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient non trouvé" },
        { status: 404 }
      );
    }

    await prisma.patient.update({
      where: { id: patientId },
      data: { nom, prenom, age, telephone, adresse },
    });

    const agenda = await prisma.agenda.findFirst({
      where: { patientId: patientId },
      orderBy: { date: "desc" },
    });

    if (!agenda) {
      return NextResponse.json(
        { error: "Aucun agenda trouvé pour ce patient" },
        { status: 400 }
      );
    }

    const totalPrix = soins.reduce(
      (sum: number, soin: any) => sum + soin.prix,
      0
    );
    const detailsData = soins.map((soin: any) => ({
      soinId: soin.id,
      prix: soin.prix,
    }));

    const facture = await prisma.facture.create({
      data: {
        patientId: patient.id,
        cliniqueId: patient.cliniqueId,
        agendaId: agenda.id,
        prix: totalPrix,
        details: {
          create: detailsData,
        },
      },
    });

    return NextResponse.json({ patient, facture });
  } catch (error) {
    console.error("Erreur modification patient:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
