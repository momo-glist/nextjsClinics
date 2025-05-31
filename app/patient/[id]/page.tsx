"use client";

import Wrapper from "@/app/components/Wrapper";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import { getUtilisateur } from "@/app/action";
import { Clinique } from "@/app/type";
import { supabase } from "@/lib/supabaseClient";
import OrdonnancePDF from "@/app/components/OrdonnancePDF";

const PatientDetailPage = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string | undefined;
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [agendaEnAttente, setAgendaEnAttente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<string[]>([""]);
  const [fichier, setFichier] = useState<File | null>(null);
  const [clinique, setClinique] = useState<Clinique | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSoins, setSelectedSoins] = useState<string[]>([]);
  const router = useRouter();

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
    const fetchPatient = async () => {
      try {
        const res = await fetch(`/api/patient/${id}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du patient.");
        }
        const data = await res.json();
        setPatient(data.patient);
        setAgendaEnAttente(data.agendaEnAttente);
        setSelectedSoins(
          data.agendaEnAttente?.agendaSoins.map((as: any) => as.soin.id) || []
        );
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

  const ajouterPrescription = () => {
    setPrescriptions([...prescriptions, ""]);
  };

  const handlePrescriptionChange = (index: number, value: string) => {
    const nouvellesPrescriptions = [...prescriptions];
    nouvellesPrescriptions[index] = value;
    setPrescriptions(nouvellesPrescriptions);
  };

  const handleSubmitConsultation = async () => {
    setLoading(true);

    if (!prescriptions.length && !fichier) {
      toast.error(
        "Veuillez remplir au moins un champ (prescription ou fichier)."
      );
      setLoading(false);
      return;
    }

    let fichierUrl = null;

    if (fichier) {
      const safeFileName = `${uuidv4()}_${fichier.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("fichier")
        .upload(safeFileName, fichier, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Erreur d'upload :", uploadError.message);
        toast.error("Erreur lors de l'upload du fichier.");
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("fichier")
        .getPublicUrl(safeFileName);
      fichierUrl = data.publicUrl;
    }

    try {
      const res = await fetch(
        `/api/consultation/${agendaEnAttente?.id}/valider`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fichier: fichierUrl,
            remarque: prescriptions.join(" | "),
            patientId: String(id),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Erreur lors de la validation de l'agenda.");
      }

      toast.success("Agenda validé avec succès !");
      router.push("/rendez-vous");
    } catch (error: any) {
      toast.error(error.message || "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  };

const handleSubmitAgenda = async () => {
  if (!prescriptions.length && !fichier) {
    toast.error(
      "Veuillez remplir au moins un champ (prescription ou fichier)."
    );
    return;
  }

  if (!selectedDate) {
    toast.error("Veuillez choisir une date pour le rendez-vous.");
    return;
  }

    let fichierUrl = null;

    if (fichier) {
      const safeFileName = `${uuidv4()}_${fichier.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("fichier")
        .upload(safeFileName, fichier, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Erreur d'upload :", uploadError.message);
        toast.error("Erreur lors de l'upload du fichier.");
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("fichier")
        .getPublicUrl(safeFileName);
      fichierUrl = data.publicUrl;
    }

  try {
    const res = await fetch("/api/agenda", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId: id,
        prescription: prescriptions.join(" | "),
        date: selectedDate,
        soins: selectedSoins,
        fichier: fichierUrl || null,
      }),
    });

    if (!res.ok) {
      throw new Error("Erreur lors de l'enregistrement dans l'agenda.");
    }

    toast.success("Agenda enregistré !");
    router.push("/rendez-vous");
  } catch (error: any) {
    toast.error(error.message || "Erreur inconnue.");
  }
};

  const ordonnanceRef = useRef<HTMLDivElement>(null);

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
        <div className="text-center text-red-500 mt-10">
          Patient non trouvé.
        </div>
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
          <h3 className="font-semibold text-lg mb-2">
            Informations personnelles
          </h3>
          <p>
            <strong>Nom :</strong> {patient.nom}
          </p>
          <p>
            <strong>Prénom :</strong> {patient.prenom}
          </p>
          <p>
            <strong>Age :</strong> {patient.age}
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
      <div className="mb-4">
        <label className="label">
          <span className="label-text font-semibold">
            Choisir un ou plusieurs soins
          </span>
        </label>
        <div className="flex flex-wrap gap-4">
          {agendaEnAttente?.agendaSoins.map((as: any) => {
            const soinId = as.soin.id;
            const soinNom = as.soin.nom;
            const isChecked = selectedSoins.includes(soinId);

            return (
              <label key={soinId} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={soinId}
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSoins([...selectedSoins, soinId]);
                    } else {
                      setSelectedSoins(
                        selectedSoins.filter((id) => id !== soinId)
                      );
                    }
                  }}
                  className="checkbox"
                />
                <span>{soinNom}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Bloc flex horizontal */}
      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* Données de consultation */}
        <div className="card bg-base-100 shadow-md p-4 w-full md:w-1/2">
          <h3 className="font-semibold text-lg mb-4">
            Données de consultation
          </h3>

          {/* Zone de prescription */}
          <div className="mb-4">
            <label className="label">
              <span className="label-text font-semibold">Prescriptions</span>
            </label>

            {prescriptions.map((presc, index) => (
              <input
                key={index}
                type="text"
                className="input input-bordered w-full mb-2"
                placeholder={`Prescription ${index + 1}`}
                value={presc}
                onChange={(e) =>
                  handlePrescriptionChange(index, e.target.value)
                }
              />
            ))}

            <button
              type="button"
              className="btn btn-outline btn-sm mt-2"
              onClick={ajouterPrescription}
            >
              Ajouter une prescription
            </button>
          </div>

          <div className="flex items-end gap-4 mb-4">
            {/* Champ fichier */}
            <div className="flex-1">
              <input
                type="file"
                className="file-input file-input-bordered w-full"
                onChange={handleFileChange}
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className={`btn btn-primary ${loading ? "loading" : ""}`}
                onClick={handleSubmitConsultation}
              >
                ajouter la consultation
              </button>
              <button
                className={`btn btn-secondary ${loading ? "loading" : ""}`}
                onClick={() => setShowModal(true)}
                disabled={loading}
              >
                Ajouter à l'agenda
              </button>
            </div>
          </div>
        </div>

        {/* Ordonnance PDF */}
        {prescriptions.filter((p) => p.trim() !== "").length > 0 && (
          <div className="card bg-base-100 shadow-md p-4 w-full md:w-1/2">
            <OrdonnancePDF
              nom={patient.nom}
              prenom={patient.prenom}
              adresse={patient.adresse || "Adresse non précisée"}
              date={new Date().toISOString()}
              remarques={prescriptions}
              clinique={clinique}
              ref={ordonnanceRef}
            />
          </div>
        )}
        {showModal && (
          <dialog className="modal modal-open">
            <div className="modal-box space-y-4">
              <h3 className="font-bold text-lg">Choisir la date et l'heure</h3>

              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              <div className="modal-action flex justify-end gap-4 mt-4">
                <button
                  className="btn"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDate("");
                  }}
                >
                  Annuler
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleSubmitAgenda}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </Wrapper>
  );
};

export default PatientDetailPage;
