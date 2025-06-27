"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Wrapper from "../../components/Wrapper";
import { toast } from "react-toastify";
import { Stock } from "@/app/type";
import { useParams } from "next/navigation";

const UpdateMedicamentPage = () => {
  const params = useParams();
  const medocId = params?.id as string;
  const [stock, setStock] = useState<Stock>({
    id: "",
    nom: "",
    forme: "",
    dosage_valeur: "",
    dosage_unite: "",
    fournisseur: "",
    codeBar: "",
    prixAchat: 0,
    prix: 0,
    quantite: 0,
    dateAchat: "",
    datePeremption: "",
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Stock>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch(`/api/stock/${medocId}`);
        const rawData = await res.json();
        console.log(rawData);
        setStock(rawData);
      } catch (error) {
        toast.error("Erreur lors du chargement des médicaments");
        console.error(error);
      }
    };

    fetchStock();
  }, [medocId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setStock({ ...stock, [name]: value });
  };

  const onSubmit = async (data: Stock) => {
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

  return (
    <Wrapper>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Augmenter le stock du médicament</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* CatalogueMedicament */}
          <div>
            <label className="label">Nom</label>
            <input
              type="text"
              value={stock.nom}
              readOnly
              className="input input-bordered w-full mb-3"
            />
          </div>

          <div>
            <label className="label">Forme</label>
            <input
              type="text"
              value={stock.forme}
              readOnly
              className="input input-bordered w-full mb-3"
            />
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="label">Dosage</label>
              <input
                type="text"
                value={stock.dosage_valeur}
                readOnly
                className="input input-bordered w-full mb-3"
              />
            </div>
            <div className="flex-1">
              <label className="label">Unité</label>
              <input
                type="text"
                value={stock.dosage_unite}
                readOnly
                className="input input-bordered w-full mb-3"
              />
            </div>
          </div>

          <div>
            <label className="label">Fournisseur</label>
            <input
              type="text"
              placeholder="Ex : Laborex"
              value={stock.fournisseur}
              onChange={handleChange}
              className="input input-bordered w-full mb-3"
            />
          </div>

          <div>
            <label className="label">Code barre (optionnel)</label>
            <input
              type="text"
              placeholder="Ex : Laborex"
              value={stock.codeBar}
              onChange={handleChange}
              className="input input-bordered w-full mb-3"
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
              value={stock.prix}
            />
          </div>

          {/* Stock initial et Achat */}
          <div>
            <label className="label">Quantité</label>
            <input
              type="number"
              placeholder="Ex : 50"
              value={stock.quantite}
              onChange={handleChange}
              className="input input-bordered w-full mb-3"
            />
          </div>

          <div>
            <label className="label">Prix unitaire d'achat</label>
            <input
              type="number"
              placeholder="Ex : 150"
              value={stock.prixAchat}
              onChange={handleChange}
              className="input input-bordered w-full mb-3"
            />
          </div>
          <label className="label">
            <span className="label-text font-semibold">Date d’achat</span>
          </label>
          <input
            type="date"
            value={stock.dateAchat}
            onChange={handleChange}
            className="input input-bordered w-full mb-4"
          />

          <div>
            <label className="label">Date de péremption</label>
            <input
              type="date"
              value={stock.datePeremption}
              onChange={handleChange}
              className="input input-bordered w-full mb-4"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            Augmenter le stock
          </button>
        </form>
      </div>
    </Wrapper>
  );
};

export default UpdateMedicamentPage;
