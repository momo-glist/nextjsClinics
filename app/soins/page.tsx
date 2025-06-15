"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import { Soin, Specialite } from "../type";
import { toast } from "react-toastify";
import { Pencil, Trash } from "lucide-react";
import EmptyState from "../components/EmptyState";
import SoinModal from "../components/SoinModal";
import Link from "next/link";

const page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const [soins, setSoins] = useState<Soin[]>([]);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingSoin, setEditingSoin] = useState<string | null>(null);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [selectedSpecialite, setSelectedSpecialite] = useState("");

  useEffect(() => {
    const fetchSpecialites = async () => {
      try {
        const res = await fetch("/api/specialite");
        const data = await res.json();
        setSpecialites(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des spécialités");
        console.error(error);
      }
    };

    fetchSpecialites();
  }, []);

  useEffect(() => {
    const fetchSoins = async () => {
      try {
        const res = await fetch("/api/soins");
        const data = await res.json();
        setSoins(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des soins");
        console.error(error);
      }
    };
    fetchSoins();
  }, []);

  const handleDeleteSoins = async (id: string) => {
    try {
      const res = await fetch("/api/soins", {
        method: "DELETE",
        body: JSON.stringify({ id: id }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        toast.success("Soin supprimée avec succès");
        setSoins((prev) => prev.filter((s) => s.id !== id));
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur s'est produite");
      console.error(error);
    }
  };

  const openCreateModal = () => {
    setNom("");
    setDescription("");
    setPrix("");
    setSelectedSpecialite(""); // Très important !
    setEditMode(false);
    setEditingSoin(null);
    (
      document.getElementById("category_modal") as HTMLDialogElement
    )?.showModal();
  };

  const closeModal = () => {
    setNom("");
    setDescription("");
    setPrix("");
    setSelectedSpecialite("");
    setEditMode(false);
    setEditingSoin(null);
    (document.getElementById("category_modal") as HTMLDialogElement)?.close();
  };

  const handleCreateSoin = async () => {
    if (!nom || !description || !selectedSpecialite) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    const specialite = specialites.find((s) => s.id === selectedSpecialite);
    if (!specialite) {
      toast.error("Spécialité invalide.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/soins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nom,
          description,
          prix: parseFloat(prix),
          specialiteId: selectedSpecialite,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la création.");
      }

      const data = await res.json();
      const newSoin = data.soin;
      setSoins((prev) => [...prev, newSoin]);
      toast.success("Soin créé avec succès !");
      closeModal();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSoin = async () => {
    if (!nom || !description || !selectedSpecialite) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    if (!editingSoin) {
      toast.error("Aucune spécialité sélectionnée pour la modification.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/soins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingSoin,
          nom,
          description,
          specialiteId: selectedSpecialite,
          prix: parseFloat(prix),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour.");
      }

      const data = await res.json();
      const updatedSoin = data.soin;
      setSoins((prev) =>
        prev.map((s) => (s.id === updatedSoin.id ? updatedSoin : s))
      );

      toast.success("Soin mise à jour avec succès !");
      closeModal();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (soin: Soin) => {
    setNom(soin.nom);
    setDescription(soin.description || "");
    setPrix(soin.prix || "");
    setSelectedSpecialite(soin.specialite?.id || "");
    setEditMode(true);
    setEditingSoin(soin.id);
    (
      document.getElementById("category_modal") as HTMLDialogElement
    )?.showModal();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calcul des patients à afficher
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = soins.slice(indexOfFirstItem, indexOfLastItem);

  // Nombre total de pages
  const totalPages = Math.ceil(soins.length / itemsPerPage);

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
      {soins.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="flex flex-col">
            <span className="font-bold text-3xl text-primary tracking-wide mb-10">
              Soins
            </span>
            <div>
              <div className="mb-4">
                <button className="btn btn-primary" onClick={openCreateModal}>
                  Ajouter un soin
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Spécialité</th>
                    <th>Prix</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPatients.map((soin: any, index: number) => (
                    <tr key={soin.id}>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>{soin.nom}</td>
                      <td>{soin.description}</td>
                      <td>{soin.specialite?.nom}</td>
                      <td>{soin.prix}</td>
                      <td className="flex gap-2 flex-col">
                        <button
                          className="btn btn-secondary btn-xs w-fit transition duration-200 hover:scale-105 hover:brightness-90 hover:shadow-md"
                          onClick={() => openEditModal(soin)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-error btn-xs w-fit transition duration-200 hover:scale-105 hover:brightness-90 hover:shadow-md"
                          onClick={() => handleDeleteSoins(soin.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          </div>
        </div>
      ) : (
        <EmptyState message={"Aucun soin créé"} IconComponent="Group" />
      )}

      <SoinModal
        nom={nom}
        description={description}
        specialite={selectedSpecialite}
        prix={prix}
        specialites={specialites}
        onChangeNom={setNom}
        onChangeDescription={setDescription}
        onChangePrix={setPrix}
        onChangeSpecialite={setSelectedSpecialite}
        onSubmit={editMode ? handleUpdateSoin : handleCreateSoin}
        onclose={closeModal}
        loading={loading}
        editMode={editMode}
      />
    </Wrapper>
  );
};

export default page;
