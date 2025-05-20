"use client";

import React, { useState, useEffect } from "react";
import Wrapper from "@/app/components/Wrapper";
import { toast } from "react-toastify";
import { Soin } from "@/app/type";

const CreatePatientPage = () => {
  const [loading, setLoading] = useState(false);
  const [soinsDisponibles, setSoinsDisponibles] = useState<Soin[]>([]);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    telephone: "",
    adresse: "",
    temperature: "",
    tension: "",
    poids: "",
    soins: [] as string[],
  });

  // Charger les soins disponibles depuis l'API
  useEffect(() => {
    const fetchSoins = async () => {
      try {
        const res = await fetch("/api/soins");
        const data = await res.json();
        setSoinsDisponibles(data);
      } catch (error) {
        console.error("Erreur lors du chargement des soins", error);
      }
    };

    fetchSoins();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "soins") {
      const options = (e.target as HTMLSelectElement).selectedOptions;
      const selected = Array.from(options).map((option) => option.value);
      setFormData({ ...formData, soins: selected });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Création du patient, agenda, facture
      const patientRes = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          age: new Date().getFullYear() - new Date(formData.date_naissance).getFullYear(),
          telephone: formData.telephone,
          adresse: formData.adresse,
          soins: formData.soins,
        }),
      });

      if (!patientRes.ok) throw new Error("Erreur création patient");

      const { patient } = await patientRes.json();

      // 2. Enregistrement des paramètres vitaux
      const vitauxRes = await fetch("/api/parametres-vitaux", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: patient.id,
          temperature: parseFloat(formData.temperature),
          tension: formData.tension,
          poids: parseFloat(formData.poids),
        }),
      });

      if (!vitauxRes.ok)
        throw new Error("Erreur enregistrement paramètres vitaux");

      toast.success("Patient, agenda et facture enregistrés avec succès");

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
        soins: [],
      });
    } catch (error) {
      toast.error("Erreur pendant l’enregistrement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="max-w-3xl mx-auto mt-10">
        <h2 className="text-2xl font-bold mb-6">
          Ajouter un patient + soins + paramètres vitaux
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

          <select
            name="soins"
            multiple
            className="select select-bordered w-full col-span-full"
            value={formData.soins}
            onChange={handleChange}
            required
          >
            {soinsDisponibles.map((soin) => (
              <option key={soin.id} value={soin.id}>
                {soin.nom} - {soin.prix} FCFA
              </option>
            ))}
          </select>

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