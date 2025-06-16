"use client";

import React, { useState, useEffect, useRef } from "react";
import Wrapper from "@/app/components/Wrapper";
import { toast } from "react-toastify";
import { Soin } from "@/app/type";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import InvoicePDF from "@/app/components/InvoicePDF";
import { useUser } from "@clerk/nextjs";
import { getUtilisateur } from "@/app/action";
import { Clinique } from "@/app/type";
import { useParams } from "next/navigation";

const UpdatePatientPage = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string | undefined;
  const [loading, setLoading] = useState(false);
  const [soinsDisponibles, setSoinsDisponibles] = useState<Soin[]>([]);
  const [prixSoins, setPrixSoins] = useState<{ [soinId: string]: number }>({});
  const [agenda, setAgenda] = useState<any>(null);
  const [soinsDuRendezVous, setSoinsDuRendezVous] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    age: "",
    telephone: "",
    adresse: "",
    temperature: "",
    tension: "",
    poids: "",
    date: "",
    soins: [] as string[],
  });
  const params = useParams();
  const id = params?.id;
  const [clinique, setClinique] = useState<Clinique | null>(null);
  const [patient, setPatient] = useState<any>(null);

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

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const invoiceRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!patient || !agenda || soinsDuRendezVous.length === 0) return;

    const vitaux = patient.parametresVitaux?.[0];

    const nouveauxSoins = soinsDuRendezVous.map((as) => as.soin.id);

    setFormData({
      nom: patient.nom || "",
      prenom: patient.prenom || "",
      age: patient.age?.toString() || "",
      telephone: patient.telephone || "",
      adresse: patient.adresse || "",
      temperature: vitaux?.temperature?.toString() || "",
      tension: vitaux?.tension || "",
      poids: vitaux?.poids?.toString() || "",
      date: agenda.date ? new Date(agenda.date).toISOString().slice(0, 16) : "",
      soins: nouveauxSoins,
    });

    const prixMap: { [id: string]: number } = {};
    soinsDuRendezVous.forEach((as) => {
      prixMap[as.soin.id] = as.soin.prix;
    });
    setPrixSoins(prixMap);
  }, [patient, agenda, soinsDuRendezVous]);

  console.log("soinsDisponibles :", soinsDisponibles);
  console.log("formData.soins :", formData.soins);

  const fetchPatient = async () => {
    const res = await fetch(`/api/patient/${id}`);
    const data = await res.json();
    console.log("data patient complet:", data);
    if (data.agendaEnAttente?.agendaSoins) {
      setSoinsDuRendezVous(data.agendaEnAttente.agendaSoins);
    }

    setPatient(data.patient);
    setAgenda(data.agendaEnAttente);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name !== "soins") {
      setFormData({ ...formData, [name]: value });
    }
  };

  useEffect(() => {
    console.log("patient chargé :", patient);
  }, [patient]);

  useEffect(() => {
    console.log("formData mis à jour :", formData);
  }, [formData]);

  // ✅ Fonctions de validation
  const isValidTension = (tension: string) => {
    return /^\d{1,2}\/\d{1,2}$/.test(tension);
  };

  const isValidTemperature = (temp: string) => {
    const t = parseFloat(temp);
    return !isNaN(t) && t >= 35 && t <= 42;
  };

  const isValidPoids = (poids: string) => {
    const p = parseFloat(poids);
    return !isNaN(p) && p >= 1 && p <= 300;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Validations
    if (!isValidTension(formData.tension)) {
      toast.error("Format de tension invalide. Utilise le format ex: 12/8");
      setLoading(false);
      return;
    }

    if (!isValidTemperature(formData.temperature)) {
      toast.error("Température invalide. Elle doit être entre 35°C et 42°C");
      setLoading(false);
      return;
    }

    if (!isValidPoids(formData.poids)) {
      toast.error("Poids invalide. Il doit être entre 1 kg et 300 kg");
      setLoading(false);
      return;
    }

    const soinsAvecPrix = formData.soins.map((id) => ({
      id,
      prix: prixSoins[id] ?? 0,
    }));

    try {
      if (!patient?.id) {
        throw new Error("Patient introuvable. Impossible de modifier.");
      }

      const response = await fetch("/api/patient", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          nom: formData.nom,
          prenom: formData.prenom,
          age: parseFloat(formData.age),
          telephone: formData.telephone,
          adresse: formData.adresse,
          soins: soinsAvecPrix,
        }),
      });

      if (!response.ok)
        throw new Error("Erreur lors de la modification du patient");
      const { patient: updatedPatient } = await response.json();

      // 👉 Enregistrement des paramètres vitaux
      const vitauxRes = await fetch("/api/parametres-vitaux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: updatedPatient.id,
          temperature: parseFloat(formData.temperature),
          tension: formData.tension,
          poids: parseFloat(formData.poids),
        }),
      });

      if (!vitauxRes.ok)
        throw new Error("Erreur enregistrement paramètres vitaux");

      toast.success(
        "Patient modifié, facture et paramètres vitaux enregistrés avec succès"
      );

      // ✅ Reset
      setFormData({
        nom: "",
        prenom: "",
        age: "",
        telephone: "",
        adresse: "",
        temperature: "",
        tension: "",
        poids: "",
        date: "",
        soins: [],
      });
      setPrixSoins({});
      setPatient(null);
    } catch (error) {
      toast.error("Erreur pendant la modification");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="max-w-6xl mx-auto mt-10 flex gap-10">
        <div className="w-full md:w-1/2">
          <div
            className={`${loading ? "blur-[1px] pointer-events-none select-none" : ""}`}
          >
            <h2 className="text-2xl font-bold mb-6">Modifier le patient</h2>

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={handleSubmit}
            >
              {/* Infos patient */}
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
                type="text"
                name="nom"
                placeholder="Nom"
                className="input input-bordered w-full"
                value={formData.nom}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="age"
                placeholder="Entré l'age"
                className="input input-bordered w-full"
                value={formData.age}
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
              <input
                type="datetime-local"
                name="date"
                className="input input-bordered w-full"
                value={formData.date}
                onChange={handleChange}
              />

              {/* Soins sélectionnés avec champ prix */}
              {soinsDuRendezVous.length > 0 &&
                soinsDuRendezVous.map(({ soin }) => (
                  <div
                    key={soin.id}
                    className="flex flex-col md:flex-row gap-2 items-center col-span-full"
                  >
                    <label className="w-full md:w-1/2 font-medium">
                      Prix du soin : {soin.nom}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input input-bordered w-full md:w-1/2"
                      value={prixSoins[soin.id] ?? ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setPrixSoins((prev) => ({
                          ...prev,
                          [soin.id]: value,
                        }));
                      }}
                      min={0}
                    />
                  </div>
                ))}
              <div className="col-span-full flex justify-end">
                <button
                  type="submit"
                  className={`btn btn-primary ${loading ? "loading" : ""}`}
                  disabled={loading}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>

          {/* Overlay loader */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-50">
              <progress className="progress w-56 progress-success"></progress>
              <span className="mt-2 text-sm text-gray-600">
                Veuillez patienter...
              </span>
            </div>
          )}
        </div>
        {/* Facture à droite */}
        <div className="w-1/2 ml-8" style={{ maxHeight: "80vh" }}>
          <InvoicePDF
            ref={invoiceRef}
            nom={formData.nom}
            prenom={formData.prenom}
            adresse={formData.adresse}
            date={formData.date}
            soins={formData.soins.map((id) => {
              const soinTrouve = soinsDuRendezVous.find(
                (s) => s.soin.id === id
              );
              return {
                nom: soinTrouve?.soin.nom || "",
                prix: prixSoins[id] || 0,
              };
            })}
            clinique={clinique}
          />
        </div>
      </div>
    </Wrapper>
  );
};

export default UpdatePatientPage;
