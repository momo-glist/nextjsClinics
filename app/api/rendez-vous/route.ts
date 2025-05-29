import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(today.getDate() + 7);
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer la clinique de l'utilisateur connecté
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
    const now = new Date();

    if (
      user.role === "ADMIN" ||
      user.role === "INFIRMIER" ||
      user.role === "ADMINISTRATIF"
    ) {
      // Tous les patients avec agenda en attente
      patients = await prisma.patient.findMany({
        where: {
          cliniqueId: user.cliniqueId,
          agendas: {
            some: {
              statut: "EN_ATTENTE",
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
                gte: today,
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
    }

    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    console.error(
      "Erreur récupération patients avec agendas en attente:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
