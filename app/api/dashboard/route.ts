import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { fr } from "date-fns/locale";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(req.url);
    const periode = url.searchParams.get("periode") || "tout";

    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // Calcul des bornes selon la période demandée
    switch (periode) {
      case "semaine":
        startDate = startOfWeek(now, { weekStartsOn: 1, locale: fr });
        endDate = endOfWeek(now, { weekStartsOn: 1, locale: fr });
        break;
      case "mois":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "annee":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case "tout":
      default:
        // pas de filtre de date
        break;
    }

    // Construire un filtre date si besoin
    const dateFilter =
      startDate && endDate
        ? {
            gte: startDate,
            lte: endDate,
          }
        : undefined;

    const totalPatients = await prisma.patient.count({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
    });

    const totalConsultations = await prisma.agenda.count({
      where: {
        statut: "CONFIRME",
        ...(dateFilter ? { date: dateFilter } : {}),
      },
    });

    const totalAgenda = await prisma.agenda.count({
      where: {
        statut: "EN_ATTENTE",
        ...(dateFilter ? { date: dateFilter } : {}),
      },
    });

    const factures = await prisma.facture.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      select: {
        prix: true,
      },
    });

    const totalFacture = factures.reduce((acc, curr) => acc + curr.prix, 0);

    type WeeklyData = { day: string; consultations: number };
    let weeklyDataArray: WeeklyData[] = [];

    
      const confirmedAgendasThisWeek = await prisma.agenda.findMany({
        where: {
          statut: "CONFIRME",
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const weeklyDataMap = confirmedAgendasThisWeek.reduce(
        (acc, agenda) => {
          const day = format(new Date(agenda.date), "EEEE", {
            locale: fr,
          }).toLowerCase();
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const daysOfWeek = [
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
      ];

      weeklyDataArray = daysOfWeek.map((day) => ({
        day,
        consultations: weeklyDataMap[day] || 0,
      }));
    console.log("Agendas confirmés cette semaine :", confirmedAgendasThisWeek.length);

    
    // DOCTORS : nombre de consultations par médecin
    const medecins = await prisma.user.findMany({
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
    });

    const doctors = medecins.map((doc) => ({
      name: doc.nom,
      specialties: doc.specialites.map((s) => s.nom),
      consultations: doc.agendas.length,
    }));

    // SOINS DATA : exemple radar pour types de soins les plus fréquents
    const soinsEffectues = await prisma.agendaSoin.findMany({
      where: {
        agenda: {
          ...(dateFilter ? { date: dateFilter } : {}),
          statut: "CONFIRME",
        },
      },
      include: {
        soin: true,
      },
    });

    const soinCountMap: Record<string, number> = {};

    soinsEffectues.forEach((item) => {
      const nomSoin = item.soin.nom;
      soinCountMap[nomSoin] = (soinCountMap[nomSoin] || 0) + 1;
    });

    const soinsData = Object.entries(soinCountMap).map(([soin, score]) => ({
      soin,
      score,
    }));

    // PIE DATA : nombre de patients par spécialité
    const agendaSoins = await prisma.agendaSoin.findMany({
      include: {
        agenda: {
          select: {
            patientId: true,
            statut: true,
            date: true,
          },
        },
        soin: {
          include: {
            specialite: true,
          },
        },
      },
    });

    const agendas = await prisma.agenda.findMany({
      where: {
        statut: "CONFIRME",
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: {
        user: {
          include: {
            specialites: true,
          },
        },
        patient: true,
      },
    });

    const patientBySpecialty: Record<string, Set<string>> = {};

    agendaSoins.forEach((agendaSoin) => {
      const agenda = agendaSoin.agenda;
      const specialite = agendaSoin.soin.specialite;

      if (!agenda || agenda.statut !== "CONFIRME") return;

      if (
        dateFilter &&
        typeof dateFilter === "object" &&
        "gte" in dateFilter &&
        "lte" in dateFilter
      ) {
        const agendaDate = new Date(agenda.date);
        if (agendaDate < dateFilter.gte || agendaDate > dateFilter.lte) return;
      }

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
      weeklyData: weeklyDataArray,
      doctors,
      soinsData,
      pieData,
    });
  } catch (error) {
    console.error("Erreur récupération données dashboard:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
