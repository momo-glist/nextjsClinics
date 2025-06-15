"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Wrapper from "../components/Wrapper";
import { LigneComptaParJour } from "../type";
import * as XLSX from "xlsx";
import EmptyState from "../components/EmptyState";

interface DonneesCompta {
  mois: number;
  annee: number;
  revenuConsultations: number;
  revenuPharmacie: number;
  totalRevenus: number;
  depenses: number;
  soldeNet: number;
  listeComptaParJour: LigneComptaParJour[];
}

const page = () => {
  const [donnees, setDonnees] = useState<DonneesCompta | null>(null);
  const [loading, setLoading] = useState(true);
  const date = new Date();
  const mois = date.getMonth() + 1;
  const annee = date.getFullYear();
  const router = useRouter();

  const telechargerExcel = () => {
    if (!donnees?.listeComptaParJour?.length) return;

    const feuille = XLSX.utils.json_to_sheet(
      donnees.listeComptaParJour.map((ligne) => ({
        Libellé: ligne.libelle,
        Montant: ligne.montant,
        Date: new Date(ligne.date).toLocaleDateString(),
      }))
    );

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Comptabilité");

    XLSX.writeFile(classeur, `Comptabilite-${mois}-${annee}.xlsx`);
  };

  const [pageCourante, setPageCourante] = useState(1);
  const lignesParPage = 10;

  const indexDebut = (pageCourante - 1) * lignesParPage;
  const indexFin = indexDebut + lignesParPage;
  const lignesTotal = donnees?.listeComptaParJour?.length || 0;
  const lignesPaginees =
    donnees?.listeComptaParJour?.slice(indexDebut, indexFin) || [];

  const totalPages = Math.ceil(lignesTotal / lignesParPage);

  const handlePageSuivante = () => {
    if (pageCourante < totalPages) setPageCourante(pageCourante + 1);
  };

  const handlePagePrecedente = () => {
    if (pageCourante > 1) setPageCourante(pageCourante - 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/comptabilite?mois=${mois}&annee=${annee}`
        );
        const data = await res.json();
        setDonnees(data);
      } catch (error) {
        console.error("Erreur chargement données compta:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mois, annee]);

  return (
    <Wrapper>
      {loading ? (
        <div className="text-center">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      ) : donnees ? (
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              Comptabilité - {mois}/{annee}
            </h1>
            <div className="mb-4">
              <button
                className="btn btn-primary"
                onClick={() => router.push("/depense")}
              >
                Ajouter une dépense
              </button>
            </div>
          </div>
          <div className="flex justify-start gap-2 flex-wrap">
            <div
              className="card bg-base-100 flex-1 min-w-[150px] max-w-[180px] rounded-xl border border-gray-300"
              style={{ boxShadow: "none" }}
            >
              <div className="card-body p-4 text-left">
                <h2 className="text-sm text-gray-500">Revenus Consultations</h2>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {donnees.revenuConsultations.toLocaleString()} FCFA
                </p>
              </div>
            </div>

            <div
              className="card bg-base-100 flex-1 min-w-[150px] max-w-[180px] rounded-xl border border-gray-300"
              style={{ boxShadow: "none" }}
            >
              <div className="card-body p-4 text-left">
                <h2 className="text-sm text-gray-500">Revenus Pharmacie</h2>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {donnees.revenuPharmacie.toLocaleString()} FCFA
                </p>
              </div>
            </div>

            <div
              className="card bg-base-100 flex-1 min-w-[150px] max-w-[180px] rounded-xl border border-gray-300"
              style={{ boxShadow: "none" }}
            >
              <div className="card-body p-4 text-left">
                <h2 className="text-sm text-gray-500">Dépenses</h2>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {donnees.depenses.toLocaleString()} FCFA
                </p>
              </div>
            </div>

            <div
              className="card bg-base-100 flex-1 min-w-[150px] max-w-[180px] rounded-xl border border-gray-300"
              style={{ boxShadow: "none" }}
            >
              <div className="card-body p-4 text-left">
                <h2 className="text-sm text-gray-500">Solde Net</h2>
                <p
                  className={`text-2xl font-bold mt-2 ${donnees.soldeNet >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {donnees.soldeNet.toLocaleString()} FCFA
                </p>
              </div>
            </div>
            <div className="overflow-x-auto w-full mt-6">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Libellé</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {lignesPaginees.map((ligne, index) => (
                    <tr key={index}>
                      <td>{ligne.libelle}</td>
                      <td>{ligne.categorie}</td>
                      <td
                        className={`font-semibold ${
                          ligne.montant < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {Math.abs(ligne.montant).toLocaleString()} FCFA
                      </td>
                      <td>{new Date(ligne.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4 gap-x-4">
              <button
                className="join-item btn"
                onClick={handlePagePrecedente}
                disabled={pageCourante === 1}
              >
                «
              </button>

              <span className="text-sm text-gray-700">
                Page {pageCourante} sur {totalPages}
              </span>

              <button
                className="join-item btn"
                onClick={handlePageSuivante}
                disabled={pageCourante === totalPages}
              >
                »
              </button>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={telechargerExcel}
                className="btn btn-outline btn-sm"
              >
                Télécharger
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState message={"Aucun employé créé"} IconComponent="Group" />
      )}
    </Wrapper>
  );
};

export default page;
