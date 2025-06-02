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
    formState: { errors }
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Médicament créé avec succès !");
        reset();
      } else {
        toast.error(result.error || "Une erreur est survenue lors de la création du médicament.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur serveur lors de la création du médicament.");
    }
  };

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
            <input
              type="text"
              placeholder="Ex : Comprimé, Sirop"
              className="input input-bordered w-full"
              {...register("forme", { required: "La forme est requise" })}
            />
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
                  valueAsNumber: true
                })}
              />
            </div>
            <div className="flex-1">
              <label className="label">Unité</label>
              <input
                type="text"
                placeholder="Ex : mg, ml"
                className="input input-bordered w-full"
                {...register("dosage_unite", { required: "L'unité est requise" })}
              />
            </div>
          </div>

          <div>
            <label className="label">Laboratoire</label>
            <input
              type="text"
              placeholder="Nom du laboratoire"
              className="input input-bordered w-full"
              {...register("laboratoire", { required: "Le laboratoire est requis" })}
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
                valueAsNumber: true
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
                valueAsNumber: true
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
                valueAsNumber: true
              })}
            />
          </div>

          <div>
            <label className="label">Date de péremption</label>
            <input
              type="date"
              className="input input-bordered w-full"
              {...register("date_peremption", { required: "La date de péremption est requise" })}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Créer le médicament
          </button>
        </form>
      </div>
    </Wrapper>
  );
};

export default CreateMedicamentPage;