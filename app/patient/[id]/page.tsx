"use client";

import Wrapper from "@/app/components/Wrapper";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

const PatientDetailPage = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // États pour prescription et fichier
  const [prescription, setPrescription] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch(`/api/patient/${id}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du patient.");
        }
        const data = await res.json();
        setPatient(data);
      } catch (error: any) {
        toast.error(error.message || "Erreur inconnue.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFichier(e.target.files[0]);
    }
  };

  // Enregistrer dans Consultation
  const handleSubmitConsultation = async () => {
    if (!prescription && !fichier) {
      toast.error("Veuillez remplir au moins un champ (prescription ou fichier).");
      return;
    }

    const formData = new FormData();
    formData.append("patientId", String(id));
    formData.append("prescription", prescription);
    if (fichier) {
      formData.append("fichier", fichier);
    }

    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'enregistrement de la consultation.");
      }

      toast.success("Consultation enregistrée !");
      setPrescription("");
      setFichier(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur inconnue.");
    }
  };

  // Enregistrer dans Agenda
  const handleSubmitAgenda = async () => {
    if (!prescription && !fichier) {
      toast.error("Veuillez remplir au moins un champ (prescription ou fichier).");
      return;
    }

    const formData = new FormData();
    formData.append("patientId", String(id));
    formData.append("prescription", prescription);
    if (fichier) {
      formData.append("fichier", fichier);
    }

    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'enregistrement dans l'agenda.");
      }

      toast.success("Agenda enregistré !");
      setPrescription("");
      setFichier(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur inconnue.");
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center h-60">
          <span className="loading loading-spinner text-primary" />
        </div>
      </Wrapper>
    );
  }

  if (!patient) {
    return (
      <Wrapper>
        <div className="text-center text-red-500 mt-10">Patient non trouvé.</div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h2 className="text-2xl font-bold mb-4">
        Détails du patient : {patient.nom} {patient.prenom}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 shadow-md p-4">
          <h3 className="font-semibold text-lg mb-2">Informations personnelles</h3>
          <p>
            <strong>Nom :</strong> {patient.nom}
          </p>
          <p>
            <strong>Prénom :</strong> {patient.prenom}
          </p>
          <p>
            <strong>Date de naissance :</strong> {patient.dateNaissance}
          </p>
          <p>
            <strong>Sexe :</strong> {patient.sexe}
          </p>
          <p>
            <strong>Téléphone :</strong> {patient.telephone}
          </p>
        </div>

        <div className="card bg-base-100 shadow-md p-4">
          <h3 className="font-semibold text-lg mb-2">Paramètres vitaux</h3>
          {patient.parametresVitaux?.length > 0 ? (
            patient.parametresVitaux.map((param: any, index: number) => (
              <div key={index} className="mb-2">
                <p>
                  <strong>Poids :</strong> {param.poids} kg
                </p>
                <p>
                  <strong>Tension :</strong> {param.tension}
                </p>
                <p>
                  <strong>Température :</strong> {param.temperature} °C
                </p>
                <hr className="my-2" />
              </div>
            ))
          ) : (
            <p>Aucun paramètre vital enregistré.</p>
          )}
        </div>
      </div>

      {/* Soins liés au patient */}
      <div className="card bg-base-100 shadow-md p-4 mt-6">
        <h3 className="font-semibold text-lg mb-4">Soins associés</h3>
        {patient.agendas?.length > 0 ? (
          patient.agendas.map((agenda: any, index: number) => (
            <div key={index} className="mb-4 border p-3 rounded-md bg-base-200">
              {agenda.agendaSoins.length > 0 ? (
                <ul className="list-disc list-inside">
                  {agenda.agendaSoins.map((as: any, i: number) => (
                    <li key={i}>{as.soin.nom}</li>
                  ))}
                </ul>
              ) : (
                <p>Aucun soin associé.</p>
              )}
            </div>
          ))
        ) : (
          <p>Aucun soin trouvé.</p>
        )}
      </div>

      {/* Prescription + fichier + actions */}
      <div className="card bg-base-100 shadow-md p-4 mt-6">
        <h3 className="font-semibold text-lg mb-4">Données de consultation</h3>

        {/* Zone de prescription */}
        <div className="mb-4">
          <label className="label">
            <span className="label-text font-semibold">Prescription</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={4}
            placeholder="Écrire ici la prescription du médecin"
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
          ></textarea>
        </div>

        {/* Champ fichier */}
        <div className="mb-4">
          <label className="label">
            <span className="label-text font-semibold">Fichier (résultat, radio...)</span>
          </label>
          <input
            type="file"
            className="file-input file-input-bordered w-full"
            onChange={handleFileChange}
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4">
          <button className="btn btn-primary" onClick={handleSubmitConsultation}>
            Enregistrer dans Consultation
          </button>
          <button className="btn btn-secondary" onClick={handleSubmitAgenda}>
            Enregistrer dans Agenda
          </button>
        </div>
      </div>
    </Wrapper>
  );
};

export default PatientDetailPage;
