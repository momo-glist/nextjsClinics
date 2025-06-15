"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import EmptyState from "../components/EmptyState";
import { useRouter } from "next/navigation";
import PersonnelImage from "../components/PersonnelImage";
import Link from "next/link";
import { toast } from "react-toastify";
import { Trash } from "lucide-react";
import { Personnel } from "../type";

const Page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [personnels, setPersonnels] = useState<Personnel[]>([]);

  useEffect(() => {
    const fetchPersonnels = async () => {
      try {
        const res = await fetch("/api/employee/list");
        const data = await res.json();
        setPersonnels(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des employés");
        console.error(error);
      }
    };

    fetchPersonnels();
  }, []);

  const handleDeletePersonnel = async (id: string) => {
    try {
      const res = await fetch(`/api/employee/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Employé supprimé avec succès");
        setPersonnels((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur s'est produite");
    }
  };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
  
    // Calcul des patients à afficher
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPatients = personnels.slice(indexOfFirstItem, indexOfLastItem);
  
    // Nombre total de pages
    const totalPages = Math.ceil(personnels.length / itemsPerPage);
  
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
      {personnels.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="flex flex-col">
            <span className="font-bold text-3xl text-primary tracking-wide mb-10">
              Employés
            </span>
            <div>
              <div className="mb-4">
                <button
                  className="btn btn-primary"
                  onClick={() => router.push("/new-employee")}
                  disabled={loading}
                >
                  Ajouter un Employé
                </button>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Profil</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Rôle</th>
                    <th>Spécialité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPatients.map((personnel: any, index: number) => (
                    <tr key={personnel.id}>
                      <td>{index + 1}</td>
                      <td>
                        <PersonnelImage
                          src={personnel.image}
                          alt={personnel.nom}
                          heightClass="h-12"
                          widthClass="w-12"
                        />
                      </td>
                      <td>{personnel.nom}</td>
                      <td>{personnel.email}</td>
                      <td>{personnel.telephone}</td>
                      <td>{personnel.role}</td>
                      <td>
                        {personnel.specialites.length > 0
                          ? personnel.specialites
                              .map((s: { nom: string }) => s.nom)
                              .join(", ")
                          : "Aucune spécialité"}
                      </td>
                      <td className="flex gap-2 flex-col">
                        <Link
                          className="btn btn-xs w-fit btn-primary"
                          href={`/update-employee/${personnel.id}`}
                        >
                          Modifier
                        </Link>
                        <button
                          className="btn btn-xs w-fit"
                          onClick={() => handleDeletePersonnel(personnel.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              <div className="flex justify-start items-center mt-4 gap-x-4">
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
        </div>
      ) : (
        <EmptyState message={"Aucun employé créé"} IconComponent="Group" />
      )}
    </Wrapper>
  );
};

export default Page;
