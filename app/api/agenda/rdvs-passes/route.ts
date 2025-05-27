import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseUserId: userId },
          { id: userId }
        ],
      },
      select: {
        cliniqueId: true,
        role: true,
        specialites: { select: { id: true } },
      },
    });

    if (!user || !user.cliniqueId) {
      return NextResponse.json({ error: "Clinique non trouvée" }, { status: 400 });
    }

    const now = new Date();

    const specialiteIds = user.specialites.map(s => s.id);

    const patients = await prisma.patient.findMany({
      where: {
        cliniqueId: user.cliniqueId,
        agendas: {
          some: {
            statut: "EN_ATTENTE",
            date: { lt: now },
            agendaSoins: {
              some: {
                soin: {
                  specialiteId: { in: specialiteIds }
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        agendas: {
          where: {
            statut: "EN_ATTENTE",
            date: { lt: now },
            agendaSoins: {
              some: {
                soin: {
                  specialiteId: { in: specialiteIds }
                }
              }
            }
          },
          select: {
            id: true,
            date: true,
            agendaSoins: {
              select: {
                soin: {
                  select: {
                    nom: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const rdvsManques = patients.flatMap(patient => 
      patient.agendas.map(agenda => ({
        id: agenda.id,
        patientId: patient.id,
        patient: `${patient.prenom} ${patient.nom}`,
        date: agenda.date,
        soins: agenda.agendaSoins.map(s => s.soin.nom),
      }))
    );

    return NextResponse.json(rdvsManques, { status: 200 });
  } catch (error) {
    console.error("Erreur rendez-vous passés", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
