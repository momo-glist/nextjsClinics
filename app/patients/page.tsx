"use client";
import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Patient } from "../type";
import { toast } from "react-toastify";
import EmptyState from "../components/EmptyState";
import { Eye } from "lucide-react";

const page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [age, setAge] = useState("");
  const [adresse, setAdresse] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patient, setpatient] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch("/api/patients");
        const rawData = await res.json();
        setpatient(rawData);
      } catch (error) {
        toast.error("Erreur lors du chargement des patients");
        console.error(error);
      }
    };
    fetchPatient();
  }, []);

  const openModal = (patient: Patient) => {
    setNom(patient.nom);
    setPrenom(patient.prenom);
    setAge(patient.age);
    setAdresse(patient.adresse);
    setEditingId(patient.id);
    (
      document.getElementById("quantite_modal") as HTMLDialogElement
    )?.showModal();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calcul des patients à afficher
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = patient.slice(indexOfFirstItem, indexOfLastItem);

  // Nombre total de pages
  const totalPages = Math.ceil(patient.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <Wrapper>
      {patient.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="flex flex-col">
            <span className="font-bold text-3xl text-primary tracking-wide mb-10">
              Patients
            </span>
            <div>
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nom</th>
                  <th>Age</th>
                  <th>Adresse</th>
                  <th>Nombre de consultations</th>
                  <th>Vue sur le patient</th>
                </tr>
              </thead>
              <tbody>
                {currentPatients.map((patient: Patient, index: number) => (
                  <tr key={patient.id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>{`${patient.prenom} ${patient.nom}`}</td>
                    <td>{patient.age}</td>
                    <td>{patient.adresse}</td>
                    <td>{patient.nombreConsultationsConfirmees}</td>
                    <td>
                      <button
                        className="btn btn-xs w-fit btn-primary"
                        onClick={() => openModal(patient)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-around items-center mt-4 gap-x-4">
            <button
              className="btn btn-sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Précédent
            </button>
            <span className="text-sm">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              className="btn btn-sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Suivant
            </button>
          </div>
        </div>
      ) : (
        <EmptyState message={"Aucun patient créé"} IconComponent="Group" />
      )}
    </Wrapper>
  );
};

export default page;
