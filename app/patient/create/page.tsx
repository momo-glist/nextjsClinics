"use client";

import React, { useState } from "react";
import Wrapper from "@/app/components/Wrapper";
import { toast } from "react-toastify";

const CreatePatientPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    telephone: "",
    adresse: "",
    temperature: "",
    tension: "",
    poids: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Création du patient
      const patientRes = await fetch("/api/patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          date_naissance: new Date(formData.date_naissance),
          telephone: formData.telephone,
          adresse: formData.adresse,
        }),
      });

      if (!patientRes.ok)
        throw new Error("Erreur lors de la création du patient");

      const patientData = await patientRes.json();
      const patientId = patientData.id;

      // 2. Création des paramètres vitaux
      const vitauxRes = await fetch("/api/parametres-vitaux", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          temperature: parseFloat(formData.temperature),
          tension: formData.tension,
          poids: parseFloat(formData.poids),
        }),
      });

      if (!vitauxRes.ok)
        throw new Error(
          "Erreur lors de l’enregistrement des paramètres vitaux"
        );

      toast.success("Patient et paramètres vitaux enregistrés avec succès");

      // Reset
      setFormData({
        nom: "",
        prenom: "",
        date_naissance: "",
        telephone: "",
        adresse: "",
        temperature: "",
        tension: "",
        poids: "",
      });
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="max-w-3xl mx-auto mt-10">
        <h2 className="text-2xl font-bold mb-6">
          Ajouter un patient + paramètres vitaux
        </h2>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            name="nom"
            placeholder="Nom"
            className="input input-bordered w-full"
            value={formData.nom}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="prenom"
            placeholder="Prénom"
            className="input input-bordered w-full"
            value={formData.prenom}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="date_naissance"
            className="input input-bordered w-full"
            value={formData.date_naissance}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="telephone"
            placeholder="Téléphone"
            className="input input-bordered w-full"
            value={formData.telephone}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="adresse"
            placeholder="Adresse"
            className="input input-bordered w-full"
            value={formData.adresse}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="temperature"
            step="0.1"
            placeholder="Température (°C)"
            className="input input-bordered w-full"
            value={formData.temperature}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="tension"
            placeholder="Tension (ex: 12/8)"
            className="input input-bordered w-full"
            value={formData.tension}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="poids"
            step="0.1"
            placeholder="Poids (kg)"
            className="input input-bordered w-full"
            value={formData.poids}
            onChange={handleChange}
            required
          />
          <div className="col-span-full">
            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Créer le patient"}
            </button>
          </div>
        </form>
      </div>
    </Wrapper>
  );
};

export default CreatePatientPage;
