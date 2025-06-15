"use client";
import { useState } from "react";
import Wrapper from "../components/Wrapper";
import { toast } from "react-toastify";

const page = () => {
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [categorie, setCategorie] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/comptabilite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libelle,
          categorie,
          montant: parseFloat(montant),
          date: date || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Dépense enregistrée avec succès !");
        setLibelle("");
        setCategorie("");
        setMontant("");
        setDate("");
      } else {
        toast.error(`Erreur: ${data.error}`);
      }
    } catch (error) {
      toast.error("Erreur lors de la requête.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="max-w-md mx-auto bg-base-100 shadow-xl p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Ajouter une dépense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Libellé</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Achat de seringues"
              className="input input-bordered w-full"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Catégorie</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              required
            >
              <option value="">-- Sélectionner une catégorie --</option>
              <option value="Facture électricité">Facture électricité</option>
              <option value="Facture eau">Facture eau</option>
              <option value="Fournitures médicales">
                Fournitures médicales
              </option>
              <option value="Médicaments">Médicaments</option>
              <option value="Salaires">Salaires</option>
              <option value="Entretien & maintenance">
                Entretien & maintenance
              </option>
              <option value="Transport">Transport</option>
              <option value="Divers">Divers</option>
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Montant (FCFA)</span>
            </label>
            <input
              type="number"
              placeholder="Ex: 15000"
              className="input input-bordered w-full"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Date</span>
              <span className="label-text-alt">(optionnel)</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Ajouter la dépense"}
          </button>

          {message && (
            <div className="mt-4 text-sm text-center">
              <span
                className={
                  message.startsWith("✅") ? "text-green-600" : "text-red-600"
                }
              >
                {message}
              </span>
            </div>
          )}
        </form>
      </div>
    </Wrapper>
  );
};

export default page;
