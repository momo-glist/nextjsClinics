"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Wrapper from "../components/Wrapper";

type LigneVente = {
  id?: string;
  nom: string;
  quantite: number;
  prix_unitaire: number;
};

const Page = () => {
  const [ventes, setVentes] = useState<LigneVente[]>([
    { id: "", nom: "", quantite: 1, prix_unitaire: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [medicaments, setMedicaments] = useState<any[]>([]);
  const [suggestionsByIndex, setSuggestionsByIndex] = useState<{
    [index: number]: any[];
  }>({});

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
    setVentes([...ventes, { id: "", nom: "", quantite: 1, prix_unitaire: 0 }]);
  };

  const removeLigne = (index: number) => {
    setVentes(ventes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ventes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ventes }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur serveur");
      }

      toast.success("Vente enregistrée avec succès !");
      setVentes([{ nom: "", quantite: 1, prix_unitaire: 0 }]);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la vente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Nouvelle Vente</h2>

        {ventes.map((ligne, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row items-center gap-4 mb-4 border p-4 rounded bg-base-100 shadow"
          >
            <div className="relative w-full">
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
                        typeof m.nom === "string" &&
                        m.nom.toLowerCase().includes(value.toLowerCase())
                    );

                    setSuggestionsByIndex((prev) => ({
                      ...prev,
                      [index]: filtered.slice(0, 5),
                    }));

                    const exact = filtered.find(
                      (m) => m.nom.toLowerCase() === value.toLowerCase()
                    );

                    if (exact) {
                      const updated = [...ventes];
                      updated[index] = {
                        nom: exact.nom,
                        id: exact.id,
                        quantite: updated[index].quantite,
                        prix_unitaire: exact.prix_unitaire,
                      };
                      setVentes(updated);
                    }
                  } else {
                    setSuggestionsByIndex((prev) => ({ ...prev, [index]: [] }));
                  }
                }}
              />

              {suggestionsByIndex[index]?.length > 0 && (
                <ul className="absolute z-10 bg-white border mt-1 w-full max-h-40 overflow-y-auto shadow">
                  {suggestionsByIndex[index].map((med) => (
                    <li
                      key={med.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        const updated = [...ventes];
                        updated[index] = {
                          nom: med.nom,
                          id: med.id,
                          quantite: updated[index].quantite,
                          prix_unitaire: med.prix_unitaire,
                        };
                        setVentes(updated);
                        setSuggestionsByIndex((prev) => ({
                          ...prev,
                          [index]: [],
                        }));
                      }}
                    >
                      {med.nom}
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
              value={ligne.prix_unitaire}
              min={0}
              step="0.01"
              onChange={(e) =>
                handleChange(index, "prix_unitaire", parseFloat(e.target.value))
              }
            />
            {ventes.length > 1 && (
              <button
                onClick={() => removeLigne(index)}
                className="btn btn-error"
              >
                Supprimer
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
          onClick={handleSubmit}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Enregistrement..." : "Valider la vente"}
        </button>
      </div>
    </Wrapper>
  );
};

export default Page;
