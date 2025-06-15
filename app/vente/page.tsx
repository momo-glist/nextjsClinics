"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Wrapper from "../components/Wrapper";
import InvoicePDFVente from "../components/InvoicePharma";
import { Clinique } from "@/app/type";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { useUser } from "@clerk/nextjs";
import { getUtilisateur } from "../action";
import PaiementModal, { Paiement } from "../components/PaiementModal";

type LigneVente = {
  id?: string;
  nom: string;
  quantite: number;
  prix: number;
};

const Page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string | undefined;
  const [ventes, setVentes] = useState<LigneVente[]>([
    { id: "", nom: "", quantite: 1, prix: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [medicaments, setMedicaments] = useState<any[]>([]);
  const [suggestionsByIndex, setSuggestionsByIndex] = useState<{
    [index: number]: any[];
  }>({});
  const [showModal, setShowModal] = useState(false);
  const [modePaiement, setModePaiement] = useState<Paiement | "">("");
  const [clinique, setClinique] = useState<Clinique | null>(null);

  useEffect(() => {
    async function fetchClinique() {
      if (!email) return;

      try {
        const result = await getUtilisateur(email);
        if (result?.clinique) {
          setClinique(result.clinique);
        } else {
          console.warn("Aucune clinique associée à cet utilisateur.");
          setClinique(null);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la clinique :", error);
        setClinique(null);
      }
    }

    fetchClinique();
  }, [email]);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMedicaments = async () => {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setMedicaments(data);
      } catch (err) {
        console.error("Erreur lors du chargement des médicaments", err);
      }
    };
    fetchMedicaments();
  }, []);

  const handleChange = <K extends keyof LigneVente>(
    index: number,
    field: K,
    value: LigneVente[K]
  ) => {
    const updated = [...ventes];
    updated[index][field] = value;
    setVentes(updated);
  };

  const addLigne = () => {
    setVentes([...ventes, { id: "", nom: "", quantite: 1, prix: 0 }]);
  };

  const removeLigne = (index: number) => {
    setVentes(ventes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (mode: Paiement) => {
    setLoading(true);
    try {
      const res = await fetch("/api/vente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ventes, mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur serveur");
      }

      const invoiceElement = ref.current;
      if (invoiceElement) {
        const canvas = await html2canvas(invoiceElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("facture.pdf");
      }

      toast.success("Vente enregistrée avec succès !");
      setVentes([{ nom: "", quantite: 1, prix: 0 }]);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la vente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-primary">Nouvelle Vente</h2>

        {ventes.map((ligne, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row items-center gap-4 mb-4 border border-gray-300 p-4 rounded bg-base-100"
          >
            <div className="relative w-full ">
              <input
                type="text"
                placeholder="Paracétamol"
                className="input input-bordered w-full"
                value={ligne.nom}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange(index, "nom", value);

                  if (value.length >= 1) {
                    const filtered = medicaments.filter(
                      (m) =>
                        typeof m.catalogueMed?.nom === "string" &&
                        m.catalogueMed.nom
                          .toLowerCase()
                          .includes(value.toLowerCase())
                    );

                    setSuggestionsByIndex((prev) => ({
                      ...prev,
                      [index]: filtered.slice(0, 5),
                    }));

                    const exact = medicaments.find(
                      (med) =>
                        med.catalogueMed?.nom?.toLowerCase() ===
                        value.toLowerCase()
                    );

                    if (exact) {
                      setVentes((prev) => {
                        const updated = [...prev];
                        updated[index] = {
                          ...updated[index],
                          nom: exact.catalogueMed.nom,
                          id: exact.id,
                          prix: exact.prix,
                        };
                        return updated;
                      });
                    } else {
                      setVentes((prev) => {
                        const updated = [...prev];
                        updated[index] = {
                          ...updated[index],
                          id: "",
                          prix: 0,
                        };
                        return updated;
                      });
                    }
                  } else {
                    setSuggestionsByIndex((prev) => ({ ...prev, [index]: [] }));
                  }
                }}
              />

              {suggestionsByIndex[index]?.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 max-h-60 overflow-y-auto bg-base-100 border border-base-300 rounded-box shadow-lg divide-y divide-base-200">
                  {suggestionsByIndex[index].map((med) => (
                    <li
                      key={med.id}
                      className="p-3 hover:bg-primary hover:text-white cursor-pointer transition-all duration-150"
                      onClick={() => {
                        const updated = [...ventes];
                        updated[index] = {
                          nom: med.catalogueMed.nom,
                          id: med.id,
                          quantite: updated[index].quantite,
                          prix: med.prix,
                        };
                        setVentes(updated);
                        setSuggestionsByIndex((prev) => ({
                          ...prev,
                          [index]: [],
                        }));
                      }}
                    >
                      {med.catalogueMed.nom}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              type="number"
              placeholder="Quantité"
              className="input input-bordered w-full"
              value={ligne.quantite}
              min={1}
              onChange={(e) =>
                handleChange(index, "quantite", parseInt(e.target.value))
              }
            />
            <input
              type="number"
              placeholder="Prix unitaire"
              className="input input-bordered w-full"
              value={ligne.prix}
              min={0}
              step="0.01"
              onChange={(e) =>
                handleChange(index, "prix", parseFloat(e.target.value))
              }
            />
            {ventes.length > 1 && (
              <button
                onClick={() => removeLigne(index)}
                className="btn btn-error"
              >
                X
              </button>
            )}
          </div>
        ))}

        <div className="mb-4">
          <button onClick={addLigne} className="btn btn-outline btn-accent">
            + Ajouter un médicament
          </button>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Enregistrement..." : "Valider la vente"}
        </button>
      </div>

      {ventes.some((v) => v.nom.trim() !== "") && (
        <InvoicePDFVente
          ref={ref}
          date={new Date().toISOString()}
          produits={ventes.map((v) => ({
            nom: v.nom,
            prix_unitaire: v.prix,
            quantite: v.quantite,
          }))}
          mode={modePaiement}
          clinique={clinique}
        />
      )}

      <PaiementModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={(mode) => {
          setModePaiement(mode);
          setShowModal(false);
          handleSubmit(mode);
        }}
        selected={modePaiement}
        setSelected={setModePaiement}
      />
    </Wrapper>
  );
};

export default Page;
