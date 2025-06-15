"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Wrapper from "../components/Wrapper";
import { toast } from "react-toastify";

type FormData = {
  nom: string;
  forme: string;
  dosage_valeur: number;
  dosage_unite: string;
  laboratoire: string;
  code_barre?: string;
  prix: number;
  quantite: number;
  prix_unitaire: number;
  date_peremption: string;
};

const CreateMedicamentPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Médicament créé avec succès !");
        reset();
        setLoading(false);
      } else {
        toast.error(
          result.error ||
            "Une erreur est survenue lors de la création du médicament."
        );
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur serveur lors de la création du médicament.");
    }
  };
  const formesPharmaceutiques = [
    { value: "comprimé", label: "Comprimé" },
    { value: "comprimé effervescent", label: "Comprimé effervescent" },
    { value: "gélule", label: "Gélule" },
    { value: "capsule", label: "Capsule" },
    { value: "sirop", label: "Sirop" },
    { value: "solution buvable", label: "Solution buvable" },
    { value: "suspension buvable", label: "Suspension buvable" },
    { value: "pommade", label: "Pommade" },
    { value: "crème", label: "Crème" },
    { value: "gel", label: "Gel" },
    { value: "collyre", label: "Collyre (gouttes ophtalmiques)" },
    { value: "goutte nasale", label: "Goutte nasale" },
    { value: "suppositoire", label: "Suppositoire" },
    { value: "ovule", label: "Ovule" },
    { value: "patch", label: "Patch" },
    { value: "aérosol", label: "Aérosol" },
    { value: "injectable", label: "Solution injectable" },
    { value: "poudre", label: "Poudre" },
    { value: "granulé", label: "Granulé" },
    { value: "spray", label: "Spray" },
    { value: "mousse", label: "Mousse" },
  ];

  const unitesPharmaceutiques = [
    { value: "mg", label: "mg (milligramme)" },
    { value: "g", label: "g (gramme)" },
    { value: "µg", label: "µg (microgramme)" },
    { value: "kg", label: "kg (kilogramme)" },
    { value: "mL", label: "mL (millilitre)" },
    { value: "L", label: "L (litre)" },
    { value: "UI", label: "UI (Unité Internationale)" },
    { value: "cp", label: "cp (comprimé)" },
    { value: "gél", label: "gél (gélule)" },
    { value: "amp", label: "amp (ampoule)" },
    { value: "sachet", label: "sachet" },
    { value: "flacon", label: "flacon" },
    { value: "tube", label: "tube" },
    { value: "spray", label: "spray" },
    { value: "dose", label: "dose" },
    { value: "pulvérisation", label: "pulvérisation" },
    { value: "goutte", label: "goutte" },
  ];

  return (
    <Wrapper>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Ajouter un médicament</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* CatalogueMedicament */}
          <div>
            <label className="label">Nom</label>
            <input
              type="text"
              placeholder="Nom du médicament"
              className="input input-bordered w-full"
              {...register("nom", { required: "Le nom est requis" })}
            />
          </div>

          <div>
            <label className="label">Forme</label>
            <select
              className="select select-bordered w-full"
              {...register("forme", { required: "La forme est requise" })}
            >
              <option value="">-- Sélectionner une forme --</option>
              {formesPharmaceutiques.map((forme) => (
                <option key={forme.value} value={forme.value}>
                  {forme.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="label">Dosage</label>
              <input
                type="number"
                placeholder="Ex : 500"
                className="input input-bordered w-full"
                {...register("dosage_valeur", {
                  required: "Le dosage est requis",
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="flex-1">
              <label className="label">Unité</label>
              <select
                className="select select-bordered w-full"
                {...register("dosage_unite", {
                  required: "L'unité est requise",
                })}
              >
                <option value="">-- Sélectionner une unité --</option>
                {unitesPharmaceutiques.map((unite) => (
                  <option key={unite.value} value={unite.value}>
                    {unite.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Laboratoire</label>
            <input
              type="text"
              placeholder="Nom du laboratoire"
              className="input input-bordered w-full"
              {...register("laboratoire", {
                required: "Le laboratoire est requis",
              })}
            />
          </div>

          <div>
            <label className="label">Code barre (optionnel)</label>
            <input
              type="text"
              placeholder="Code barre du médicament"
              className="input input-bordered w-full"
              {...register("code_barre")}
            />
          </div>

          {/* Medicament */}

          <div>
            <label className="label">Prix (par unité)</label>
            <input
              type="number"
              placeholder="Prix"
              className="input input-bordered w-full"
              {...register("prix", {
                required: "Le prix est requis",
                valueAsNumber: true,
              })}
            />
          </div>

          {/* Stock initial et Achat */}
          <div>
            <label className="label">Quantité en stock</label>
            <input
              type="number"
              placeholder="Quantité initiale"
              className="input input-bordered w-full"
              {...register("quantite", {
                required: "La quantité est requise",
                valueAsNumber: true,
              })}
            />
          </div>

          <div>
            <label className="label">Prix unitaire d'achat</label>
            <input
              type="number"
              placeholder="Prix unitaire"
              className="input input-bordered w-full"
              {...register("prix_unitaire", {
                required: "Le prix unitaire d'achat est requis",
                valueAsNumber: true,
              })}
            />
          </div>

          <div>
            <label className="label">Date de péremption</label>
            <input
              type="date"
              className="input input-bordered w-full"
              {...register("date_peremption", {
                required: "La date de péremption est requise",
              })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            Créer le médicament
          </button>
        </form>
      </div>
    </Wrapper>
  );
};

export default CreateMedicamentPage;
