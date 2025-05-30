import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  startOfWeek,
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval, startOfYear, endOfYear,
  isWithinInterval,
} from "date-fns";
import { fr } from "date-fns/locale";
import { endOfWeek, differenceInCalendarDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(req.url);
    const periode = url.searchParams.get("period") || "tout";

    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (periode) {
      case "semaine":
        startDate = startOfWeek(now, { weekStartsOn: 1, locale: fr });
        endDate = endOfWeek(now, { weekStartsOn: 1, locale: fr });
        break;
      case "mois":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "annee":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
    }

    const dateFilter = startDate && endDate ? { gte: startDate, lte: endDate } : undefined;

    // Parallélisation des requêtes
    const [
      totalPatients,
      totalConsultations,
      totalAgenda,
      totalFactureAgg,
      confirmedAgendas,
      medecins,
      soinsEffectues,
      agendaSoins
    ] = await Promise.all([
      prisma.patient.count({
        where: {
          ...(dateFilter && { createdAt: dateFilter }),
        },
      }),
      prisma.agenda.count({
        where: {
          statut: "CONFIRME",
          ...(dateFilter && { date: dateFilter }),
        },
      }),
      prisma.agenda.count({
        where: {
          statut: "EN_ATTENTE",
          ...(dateFilter && { date: dateFilter }),
        },
      }),
      prisma.facture.aggregate({
        where: {
          ...(dateFilter && { date: dateFilter }),
          agenda: {
            statut: "CONFIRME",
          },
        },
        _sum: {
          prix: true,
        },
      }),
      prisma.agenda.findMany({
        where: {
          statut: "CONFIRME",
          ...(dateFilter && { date: dateFilter }),
        },
        select: {
          date: true,
          statut: true,
        },
      }),
      prisma.user.findMany({
        where: {
          role: "MEDECIN",
          agendas: {
            some: {
              statut: "CONFIRME",
              ...(dateFilter ? { date: dateFilter } : {}),
            },
          },
        },
        include: {
          specialites: true,
          agendas: {
            where: {
              statut: "CONFIRME",
              ...(dateFilter ? { date: dateFilter } : {}),
            },
          },
        },
      }),
      prisma.agendaSoin.findMany({
        where: {
          agenda: {
            ...(dateFilter ? { date: dateFilter } : {}),
            statut: "CONFIRME",
          },
        },
        include: {
          soin: true,
        },
      }),
      prisma.agendaSoin.findMany({
        where: {
          agenda: {
            statut: "CONFIRME",
            ...(dateFilter ? { date: dateFilter } : {}),
          },
        },
        include: {
          agenda: {
            select: {
              patientId: true,
              date: true,
              statut: true,
            },
          },
          soin: {
            include: {
              specialite: true,
            },
          },
        },
      }),
    ]);

    const totalFacture = totalFactureAgg._sum.prix || 0;

    // ====> NOUVEAU SYSTEME DYNAMIQUE DE REGROUPEMENT
    type PeriodicData = { period: string; consultations: number };
    let periodicDataArray: PeriodicData[] = [];

    const periodMap: Record<string, number> = {};

    confirmedAgendas.forEach((agenda) => {
      const dateObj = new Date(agenda.date);
      let periodKey = "";

      switch (periode) {
        case "semaine":
          periodKey = format(dateObj, "EEEE", { locale: fr }).toLowerCase();
          break;
        case "mois":
          const start = startOfMonth(now);
          const weekNum =
            Math.floor(
              (dateObj.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
            ) + 1;
          periodKey = `Semaine ${weekNum}`;
          break;
        case "annee":
          periodKey = format(dateObj, "MMMM", { locale: fr });
          break;
        case "tout":
        default:
          periodKey = dateObj.getFullYear().toString();
          break;
      }

      periodMap[periodKey] = (periodMap[periodKey] || 0) + 1;
    });

    if (periode === "semaine") {
      const days = [
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
      ];
      periodicDataArray = days.map((day) => ({
        period: day,
        consultations: periodMap[day] || 0,
      }));
    } else if (periode === "mois") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

      periodicDataArray = weeks.map((weekStart, i) => {
        const label = `Semaine ${i + 1}`;
        return {
          period: label,
          consultations: periodMap[label] || 0,
        };
      });
    } else if (periode === "annee") {
      const months = Array.from({ length: 12 }).map((_, i) =>
        format(new Date(now.getFullYear(), i, 1), "MMMM", { locale: fr })
      );

      periodicDataArray = months.map((month) => ({
        period: month,
        consultations: periodMap[month] || 0,
      }));
    } else if (periode === "tout") {
      const years = confirmedAgendas.map((a) => new Date(a.date).getFullYear());
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      periodicDataArray = [];

      for (let year = minYear; year <= maxYear; year++) {
        periodicDataArray.push({
          period: year.toString(),
          consultations: periodMap[year.toString()] || 0,
        });
      }
    }

    const doctors = medecins.map((doc) => ({
      name: doc.nom,
      specialties: doc.specialites.map((s) => s.nom),
      consultations: doc.agendas.length,
    }));

    const soinCountMap: Record<string, number> = {};

    soinsEffectues.forEach((item) => {
      const nomSoin = item.soin.nom;
      soinCountMap[nomSoin] = (soinCountMap[nomSoin] || 0) + 1;
    });

    const soinsData = Object.entries(soinCountMap)
      .map(([soin, score]) => ({ soin, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const patientBySpecialty: Record<string, Set<string>> = {};

    agendaSoins.forEach((agendaSoin) => {
      const agenda = agendaSoin.agenda;
      const specialite = agendaSoin.soin.specialite;

      if (!agenda || agenda.statut !== "CONFIRME") return;

      const agendaDate = new Date(agenda.date);
      if (dateFilter && (agendaDate < dateFilter.gte || agendaDate > dateFilter.lte)) return;

      const nomSpecialite = specialite.nom;
      if (!patientBySpecialty[nomSpecialite]) {
        patientBySpecialty[nomSpecialite] = new Set();
      }

      patientBySpecialty[nomSpecialite].add(agenda.patientId);
    });

    const pieData = Object.entries(patientBySpecialty).map(
      ([name, patients]) => ({
        name,
        value: patients.size,
      })
    );

    return NextResponse.json({
      totalPatients,
      totalConsultations,
      totalAgenda,
      totalFacture,
      periodicData: periodicDataArray,
      doctors,
      soinsData,
      pieData,
    });
  } catch (error) {
    console.error("Erreur récupération données dashboard:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

