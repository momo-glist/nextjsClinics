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
import DatePickerAgenda from "@/app/components/DatePicker";

const CreatePatientPage = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string | undefined;
  const [loading, setLoading] = useState(false);
  const [soinsDisponibles, setSoinsDisponibles] = useState<Soin[]>([]);
  const [prixSoins, setPrixSoins] = useState<{ [soinId: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState("");
  type FormDataType = {
    nom: string;
    prenom: string;
    age: string;
    telephone: string;
    adresse: string;
    temperature: string;
    tension: string;
    poids: string;
    date: string | null; // ✅ le vrai correctif ici
    soins: string[];
  };

  const [formData, setFormData] = useState<FormDataType>({
    nom: "",
    prenom: "",
    age: "",
    telephone: "",
    adresse: "",
    temperature: "",
    tension: "",
    poids: "",
    date: null,
    soins: [],
  });

  const [clinique, setClinique] = useState<Clinique | null>(null);

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

  const invoiceRef = useRef<HTMLDivElement>(null);
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

  const soinsFiltres = soinsDisponibles.filter(
    (soin) =>
      soin.nom.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !formData.soins.includes(soin.id)
  );

  const ajouterSoin = (soin: Soin) => {
    const newSoins = [...formData.soins, soin.id];
    setFormData({ ...formData, soins: newSoins });
    setPrixSoins((prev) => ({
      ...prev,
      [soin.id]: Number(soin.prix),
    }));
    setSearchTerm("");
  };

  const supprimerSoin = (id: string) => {
    const newSoins = formData.soins.filter((soinId) => soinId !== id);
    setFormData({ ...formData, soins: newSoins });
    setPrixSoins((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name !== "soins") {
      setFormData({ ...formData, [name]: value });
    }
  };

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

    // ✅ Validations avant tout
    if (formData.tension && !isValidTension(formData.tension)) {
      toast.error("Format de tension invalide. Utilise le format ex: 12/8");
      setLoading(false);
      return;
    }

    if (formData.temperature && !isValidTemperature(formData.temperature)) {
      toast.error("Température invalide. Elle doit être entre 35°C et 42°C");
      setLoading(false);
      return;
    }

    if (formData.poids && !isValidPoids(formData.poids)) {
      toast.error("Poids invalide. Il doit être entre 1 kg et 300 kg");
      setLoading(false);
      return;
    }

    const soinsAvecPrix = formData.soins.map((id) => ({
      id,
      prix: prixSoins[id] ?? 0,
    }));

    try {
      const patientRes = await fetch("/api/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          age: parseFloat(formData.age),
          telephone: formData.telephone,
          adresse: formData.adresse,
          date: formData.date,
          soins: soinsAvecPrix,
        }),
      });

      if (!patientRes.ok) throw new Error("Erreur création patient");

      const { patient } = await patientRes.json();

      // 👉 2. Enregistrement des paramètres vitaux
      if (formData.tension || formData.temperature || formData.poids) {
        const vitauxRes = await fetch("/api/parametres-vitaux", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: patient.id,
            temperature: formData.temperature
              ? parseFloat(formData.temperature)
              : null,
            tension: formData.tension || null,
            poids: formData.poids ? parseFloat(formData.poids) : null,
          }),
        });

        if (!vitauxRes.ok) {
          toast.error("Erreur lors de l'enregistrement des paramètres vitaux");
          setLoading(false);
          return;
        }
      }

      // 3. Génération de la facture en PDF
      // const invoiceElement = invoiceRef.current;
      // if (invoiceElement) {
      //   const canvas = await html2canvas(invoiceElement, {
      //     scale: 2,
      //     useCORS: true,
      //     allowTaint: true,
      //   });

      //   const imgData = canvas.toDataURL("image/png");

      //   const pdf = new jsPDF("p", "mm", "a4");
      //   const pdfWidth = pdf.internal.pageSize.getWidth();
      //   const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      //   pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      //   pdf.save("facture.pdf");
      // }

      toast.success("Le rendez-vous a été ajouté avec succès");

      setFormData({
        nom: "",
        prenom: "",
        age: "",
        telephone: "",
        adresse: "",
        temperature: "",
        tension: "",
        poids: "",
        date: null,
        soins: [],
      });
      setPrixSoins({});
      setSearchTerm("");
    } catch (error) {
      toast.error("Erreur pendant l’enregistrement");
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
            <h2 className="text-2xl font-bold mb-6">Ajouter un patient</h2>

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
              />
              <input
                type="text"
                name="telephone"
                placeholder="Téléphone"
                className="input input-bordered w-full"
                value={formData.telephone}
                onChange={handleChange}
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
              />
              <input
                type="text"
                name="tension"
                placeholder="Tension (ex: 12/8)"
                className="input input-bordered w-full"
                value={formData.tension}
                onChange={handleChange}
              />
              <input
                type="number"
                name="poids"
                step="0.1"
                placeholder="Poids (kg)"
                className="input input-bordered w-full"
                value={formData.poids}
                onChange={handleChange}
              />
              <DatePickerAgenda
                date={formData.date}
                setDate={(newDate) =>
                  setFormData((prev) => ({ ...prev, date: newDate }))
                }
              />

              {/* Recherche et sélection des soins */}
              <div className="col-span-full relative">
                <label className="font-semibold block mb-2">
                  Ajouter un soin
                </label>
                <input
                  type="text"
                  placeholder="Rechercher un soin..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && soinsFiltres.length > 0 && (
                  <ul className="menu menu-compact bg-base-100 shadow rounded-box w-full max-h-48 overflow-y-auto absolute z-50 mt-1">
                    {soinsFiltres.map((soin) => (
                      <li key={soin.id}>
                        <button
                          type="button"
                          className="text-left w-full"
                          onClick={() => ajouterSoin(soin)}
                        >
                          {soin.nom} — {soin.prix} FCFA
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {searchTerm && soinsFiltres.length === 0 && (
                  <div className="text-sm text-gray-400 mt-1">
                    Aucun soin trouvé
                  </div>
                )}
              </div>

              {/* Soins sélectionnés avec champ prix */}
              {formData.soins.length > 0 &&
                formData.soins.map((soinId) => {
                  const soin = soinsDisponibles.find((s) => s.id === soinId);
                  return (
                    <div
                      key={soinId}
                      className="flex flex-col md:flex-row gap-2 items-center col-span-full"
                    >
                      <label className="w-full md:w-1/2 font-medium">
                        Prix du soin : {soin?.nom}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input input-bordered w-full md:w-1/2"
                        value={prixSoins[soinId] ?? ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setPrixSoins((prev) => ({
                            ...prev,
                            [soinId]: value,
                          }));
                        }}
                        min={0}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-error ml-2"
                        onClick={() => supprimerSoin(soinId)}
                        aria-label={`Supprimer le soin ${soin?.nom}`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
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
            date={formData.date || ""}
            soins={formData.soins.map((id) => ({
              nom: soinsDisponibles.find((s) => s.id === id)?.nom || "",
              prix: prixSoins[id] || 0,
            }))}
            clinique={clinique}
          />
        </div>
      </div>
    </Wrapper>
  );
};

export default CreatePatientPage;
