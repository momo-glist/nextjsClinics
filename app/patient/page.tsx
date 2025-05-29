"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { Stethoscope, BadgeCheck, Syringe, Baby } from "lucide-react";
import { Patient, RendezVousAffiche, Utilisateur } from "../type";
import Link from "next/link";
import ModalRendezVousManques from "../components/RendezVousManques";
import { Rdv } from "../type";
import ModalReprogrammationRdv from "../components/ReprogrammationRdv";
import { toast } from "react-toastify";
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

// 🔁 Fonction pour faire commencer la semaine par le jour actuel
const rotateDays = (days: string[]) => {
  const today = new Date().getDay(); // 0 = Dimanche
  return [...days.slice(today), ...days.slice(0, today)];
};

const joursRotates = rotateDays(jours);

// Heures entre 08h00 et 18h00
const heures = Array.from({ length: 11 }, (_, i) => {
  const h = 8 + i;
  return `${h.toString().padStart(2, "0")}:00`;
});

// Couleurs aléatoires DaisyUI
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

const AgendaPage = () => {
  const [rendezVous, setRendezVous] = useState<RendezVousAffiche[]>([]);
  const [rdvsManques, setRdvsManques] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalReprogrammationOpen, setModalReprogrammationOpen] =
    useState(false);
  const [rdvSelectionne, setRdvSelectionne] = useState<Rdv | null>(null);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);

  useEffect(() => {
    const fetchUtilisateurEtAgendas = async () => {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();

        if (res.ok) {
          setUtilisateur(data);

          // Une fois utilisateur récupéré, appeler fetchAgendas
          await fetchAgendas(data);

          // Ensuite fetch des rdvs manqués
          const rdvsRes = await fetch("/api/agenda/rdvs-passes");
          const rdvsData = await rdvsRes.json();

          if (rdvsRes.ok && rdvsData.length > 0) {
            setRdvsManques(rdvsData);
            setShowModal(true);
          }
        } else {
          console.error("Erreur utilisateur :", data?.error || data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement :", error);
      }
    };

    fetchUtilisateurEtAgendas();
  }, []);

  const handleReprogrammer = (rdv: Rdv) => {
    setShowModal(false);
    setRdvSelectionne(rdv);
    setTimeout(() => {
      setModalReprogrammationOpen(true);
    }, 300);
  };

  async function fetchAgendas(utilisateur: Utilisateur) {
    try {
      const res = await fetch("/api/patient");

      if (!res.ok) {
        const error = await res.json();
        console.error("Erreur API :", error);
        return;
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("La réponse attendue n'est pas un tableau :", data);
        return;
      }

      const rdvs: RendezVousAffiche[] = [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      data.forEach((patient: Patient) => {
        patient.agendas.forEach((agenda) => {
          const date = new Date(agenda.date);

          if (date >= today && date <= end) {
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
          }
        });
      });

      console.log(utilisateur);
      setRendezVous(rdvs);
      console.log(rdvs);
    } catch (error) {
      console.error("Erreur fetchAgendas :", error);
    }
  }

  return (
    <Wrapper>
      {utilisateur ? (
        <>
          <h1 className="text-3xl font-bold mb-6">Agenda hebdomadaire</h1>
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
                          {rdv ? (
                            utilisateur.role === "MEDECIN" ? (
                              <Link href={`/patient/${rdv.patientId}`}>
                                <div
                                  className={`rounded-xl p-3 ${rdv.couleur} shadow-sm cursor-pointer hover:shadow-md transition`}
                                >
                                  <div className="flex items-center gap-2 font-medium mb-1">
                                    {rdv.icone}
                                    <span className="text-sm">{rdv.type}</span>
                                  </div>
                                  <div className="text-xs text-gray-700">
                                    {rdv.patient}
                                  </div>
                                </div>
                              </Link>
                            ) : utilisateur.role === "INFIRMIER" ? (
                              <Link href={`/patient/update/${rdv.patientId}`}>
                                <div
                                  className={`rounded-xl p-3 ${rdv.couleur} shadow-sm cursor-pointer hover:shadow-md transition`}
                                >
                                  <div className="flex items-center gap-2 font-medium mb-1">
                                    {rdv.icone}
                                    <span className="text-sm">{rdv.type}</span>
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
                                  <span className="text-sm">{rdv.type}</span>
                                </div>
                                <div className="text-xs text-gray-700">
                                  {rdv.patient}
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="text-xs text-gray-300 italic"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <ModalRendezVousManques
              rdvs={rdvsManques}
              open={showModal}
              onCloseAction={() => setShowModal(false)}
              onReprogrammerAction={handleReprogrammer}
            />
            <ModalReprogrammationRdv
              open={modalReprogrammationOpen}
              rdv={rdvSelectionne}
              onCloseAction={() => setModalReprogrammationOpen(false)}
              onSuccess={() => {
                setModalReprogrammationOpen(false);
                toast.success("Rendez-vous reprogrammé avec succès !");
                fetchAgendas(utilisateur);
              }}
            />
          </div>
        </>
      ) : (
        <EmptyState message={"Aucun Rendez vous"} IconComponent="Group" />
      )}
    </Wrapper>
  );
};

export default AgendaPage;
