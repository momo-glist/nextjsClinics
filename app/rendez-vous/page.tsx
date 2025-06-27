"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { Stethoscope, BadgeCheck, Syringe, Baby } from "lucide-react";
import ModalRendezVousManques from "../components/RendezVousManques";
import ModalReprogrammationRdv from "../components/ReprogrammationRdv";
import { Rdv } from "../type";
import { Patient, RendezVousAffiche, Utilisateur } from "../type";
import Link from "next/link";
import EmptyState from "../components/EmptyState";

const jours = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const rotateDays = (days: string[]) => {
  const today = new Date().getDay();
  return [...days.slice(today), ...days.slice(0, today)];
};

const joursRotates = rotateDays(jours);

const heures = Array.from({ length: 11 }, (_, i) => {
  const h = 8 + i;
  return `${h.toString().padStart(2, "0")}:00`;
});

const couleursDaisy = [
  "bg-blue-100",
  "bg-green-100",
  "bg-purple-100",
  "bg-indigo-100",
  "bg-emerald-100",
  "bg-sky-100",
  "bg-rose-100",
  "bg-orange-100",
];

const getSoinStyle = (type: string) => {
  if (type.includes("Accouchement")) {
    return {
      couleur: "bg-pink-100",
      icone: <Baby className="w-4 h-4 text-pink-700" />,
    };
  }
  if (type.includes("Vaccination")) {
    return {
      couleur: "bg-yellow-100",
      icone: <Syringe className="w-4 h-4 text-yellow-700" />,
    };
  }
  if (type.includes("Échographie")) {
    return {
      couleur: "bg-purple-100",
      icone: <BadgeCheck className="w-4 h-4 text-purple-700" />,
    };
  }

  const couleurAleatoire =
    couleursDaisy[Math.floor(Math.random() * couleursDaisy.length)];
  return {
    couleur: couleurAleatoire,
    icone: <Stethoscope className="w-4 h-4 text-blue-700" />,
  };
};

const RdvPage = () => {
  const [rendezVous, setRendezVous] = useState<RendezVousAffiche[]>([]);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [rdvsDepasses, setRdvsDepasses] = useState<Rdv[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReprogOpen, setModalReprogOpen] = useState(false);
  const [rdvAReprogrammer, setRdvAReprogrammer] = useState<Rdv | null>(null);

  useEffect(() => {
    const fetchUtilisateur = async () => {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();

        if (res.ok) {
          setUtilisateur(data);
          fetchWeekAgendas(currentWeekOffset, data);
        } else {
          console.log("Erreur utilisateur :", data?.error || data);
        }
      } catch (error) {
        console.log(
          "Erreur lors de la récupération de l'utilisateur :",
          error
        );
      }
    };

    fetchUtilisateur();
  }, []);

  async function fetchWeekAgendas(offset: number, utilisateur: Utilisateur) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = new Date(today);
      start.setDate(start.getDate() + offset * 7);

      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const startISO = start.toISOString();
      const endISO = end.toISOString();

      const res = await fetch(`/api/patient?start=${startISO}&end=${endISO}`);

      if (!res.ok) {
        console.log("Erreur API :", await res.json());
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.log("La réponse attendue n'est pas un tableau :", data);
        return;
      }

      const rdvs: RendezVousAffiche[] = [];

      data.forEach((patient: Patient) => {
        patient.agendas.forEach((agenda) => {
          const date = new Date(agenda.date);

          const typesDeSoin = agenda.agendaSoins.map((a) => a.soin.nom);
          const type = typesDeSoin.join(", ") || "Consultation";
          const { couleur, icone } = getSoinStyle(
            typesDeSoin[0] || "Consultation"
          );

          rdvs.push({
            jour: jours[date.getDay()],
            heure: `${date.getHours().toString().padStart(2, "0")}:00`,
            patient: `${patient.prenom} ${patient.nom}`,
            type,
            couleur,
            icone,
            patientId: patient.id,
          });
        });
      });

      setRendezVous(rdvs);
      try {
        const resDepasses = await fetch("/api/agenda/rdvs-passes");
        if (!resDepasses.ok) {
          console.log("Erreur API RDVs dépassés :", await resDepasses.json());
          return;
        }

        const dataDepasses = await resDepasses.json();
        if (Array.isArray(dataDepasses) && dataDepasses.length > 0) {
          setRdvsDepasses(dataDepasses);
          setModalOpen(true);
        } else {
          setModalOpen(false);
          setRdvsDepasses([]);
        }
      } catch (error) {
        console.log("Erreur fetch RDVs dépassés :", error);
      }
    } catch (error) {
      console.log("Erreur fetchAgendasForWeek :", error);
    }
  }

  function handleCloseModal() {
    setModalOpen(false);
  }

  function handleReprogrammer(rdv: Rdv) {
    setRdvAReprogrammer(rdv);
    setModalReprogOpen(true);
  }

  const handleCloseReprogrammation = () => {
    setModalReprogOpen(false);
    setRdvAReprogrammer(null);
  };

  const handleReprogSuccess = () => {
    if (utilisateur) {
      fetchWeekAgendas(currentWeekOffset, utilisateur);
    }
    setModalReprogOpen(false);
    setRdvAReprogrammer(null);
  };

  useEffect(() => {
    if (utilisateur) {
      fetchWeekAgendas(currentWeekOffset, utilisateur);
    }
  }, [currentWeekOffset, utilisateur]);

  return (
    <Wrapper>
      {utilisateur ? (
        <>
          <h1 className="text-3xl font-bold mb-2">Agenda hebdomadaire</h1>

          <div className="flex items-center gap-4 mb-4">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => {
                if (currentWeekOffset > 0) {
                  setCurrentWeekOffset((prev) => prev - 1);
                }
              }}
              disabled={currentWeekOffset === 0}
            >
              ←
            </button>

            <p className="text-lg font-medium">
              Semaine du{" "}
              {new Date(
                new Date().setDate(new Date().getDate() + currentWeekOffset * 7)
              ).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <button
              className="btn btn-sm btn-outline"
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            >
              →
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200 text-base font-semibold">
                  <th className="bg-base-100">Heure</th>
                  {joursRotates.map((jour) => (
                    <th key={jour} className="bg-base-100 text-center">
                      {jour}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heures.map((heure) => (
                  <tr key={heure} className="hover">
                    <td className="font-semibold text-sm">{heure}</td>
                    {joursRotates.map((jour) => {
                      const rdv = rendezVous.find(
                        (r) => r.heure === heure && r.jour === jour
                      );
                      return (
                        <td key={`${jour}-${heure}`} className="align-top">
                          <div className="flex flex-col md:w-[140px] gap-2">
                            {rendezVous
                              .filter(
                                (r) => r.heure === heure && r.jour === jour
                              )
                              .map((rdv, index) => (
                                <div key={index}>
                                  {utilisateur.role === "MEDECIN" ? (
                                    <Link href={`/patient/${rdv.patientId}`}>
                                      <div
                                        className={`rounded-xl p-3 ${rdv.couleur} shadow-sm cursor-pointer hover:shadow-md transition`}
                                      >
                                        <div className="flex items-center gap-2 font-medium mb-1">
                                          {rdv.icone}
                                          <span className="text-sm">
                                            {rdv.type}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-700">
                                          {rdv.patient}
                                        </div>
                                      </div>
                                    </Link>
                                  ) : utilisateur.role === "INFIRMIER" ? (
                                    <Link
                                      href={`/patient/update/${rdv.patientId}`}
                                    >
                                      <div
                                        className={`rounded-xl p-3 ${rdv.couleur} shadow-sm cursor-pointer hover:shadow-md transition`}
                                      >
                                        <div className="flex items-center gap-2 font-medium mb-1">
                                          {rdv.icone}
                                          <span className="text-sm">
                                            {rdv.type}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-700">
                                          {rdv.patient}
                                        </div>
                                      </div>
                                    </Link>
                                  ) : (
                                    <div
                                      onClick={() => {}}
                                      className={`rounded-xl p-3 ${rdv.couleur} shadow-sm cursor-pointer hover:shadow-md transition`}
                                    >
                                      <div className="flex items-center gap-2 font-medium mb-1">
                                        {rdv.icone}
                                        <span className="text-sm">
                                          {rdv.type}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-700">
                                        {rdv.patient}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState message={"Aucun Rendez vous"} IconComponent="Group" />
      )}
      <ModalRendezVousManques
        rdvs={rdvsDepasses}
        open={modalOpen}
        onCloseAction={handleCloseModal}
        onReprogrammerAction={handleReprogrammer}
      />
      <ModalReprogrammationRdv
        open={modalReprogOpen}
        rdv={rdvAReprogrammer}
        onCloseAction={handleCloseReprogrammation}
        onSuccess={handleReprogSuccess}
      />
    </Wrapper>
  );
};

export default RdvPage;
