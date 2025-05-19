import React from "react";
import Wrapper from "../components/Wrapper";
import { Stethoscope, BadgeCheck, Syringe, Baby } from "lucide-react";

const rendezVous = [
  { jour: "Lundi", heure: "09:00", patient: "Lea Martin", type: "Consultation", couleur: "bg-blue-100", icone: <Stethoscope className="w-4 h-4 text-blue-700" /> },
  { jour: "Mardi", heure: "11:00", patient: "Celine Bernard", type: "Prévention", couleur: "bg-yellow-100", icone: <BadgeCheck className="w-4 h-4 text-yellow-700" /> },
  { jour: "Lundi", heure: "14:00", patient: "Jean Dubois", type: "Gynécologie", couleur: "bg-purple-100", icone: <Stethoscope className="w-4 h-4 text-purple-700" /> },
  { jour: "Lundi", heure: "15:00", patient: "Nicolas Lefevre", type: "Suivi", couleur: "bg-green-100", icone: <Syringe className="w-4 h-4 text-green-700" /> },
  { jour: "Vendredi", heure: "16:00", patient: "Paul Lambert", type: "Accouchement", couleur: "bg-red-100", icone: <Baby className="w-4 h-4 text-red-700" /> },
];

const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const heures = Array.from({ length: 11 }, (_, i) => {
  const h = 8 + i;
  return `${h.toString().padStart(2, "0")}:00`;
});

const AgendaPage = () => {
  return (
    <Wrapper>
      <h1 className="text-3xl font-bold mb-6">Agenda hebdomadaire</h1>

      <div className="overflow-x-auto rounded-xl">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200 text-base font-semibold">
              <th className="bg-base-100">Heure</th>
              {jours.map((jour) => (
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
                {jours.map((jour) => {
                  const rdv = rendezVous.find((r) => r.heure === heure && r.jour === jour);
                  return (
                    <td key={`${jour}-${heure}`} className="align-top">
                      {rdv ? (
                        <div className={`rounded-xl p-3 ${rdv.couleur} shadow-sm`}>
                          <div className="flex items-center gap-2 font-medium mb-1">
                            {rdv.icone}
                            <span className="text-sm">{rdv.type}</span>
                          </div>
                          <div className="text-xs text-gray-700">{rdv.patient}</div>
                        </div>
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
      </div>
    </Wrapper>
  );
};

export default AgendaPage;

