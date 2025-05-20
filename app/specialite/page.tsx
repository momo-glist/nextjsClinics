"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import { Specialite } from "../type";
import { toast } from "react-toastify";
import { Pencil, Trash } from "lucide-react";
import EmptyState from "../components/EmptyState";
import SpecialiteModal from "../components/SpecialiteModal";
import Link from "next/link";

const page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchSpecialites = async () => {
      try {
        const res = await fetch("/api/specialite");
        const data = await res.json();
        setSpecialites(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des specialités");
        console.error(error);
      }
    };
    fetchSpecialites();
  }, []);

  const handleDeleteSpecialite = async (id: string) => {
    try {
      const res = await fetch(`/api/specialite/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Specialité supprimée avec succès");
        setSpecialites((prev) => prev.filter((s) => s.id !== id));
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
    setEditMode(false);
    (
      document.getElementById("category_modal") as HTMLDialogElement
    )?.showModal();
  };

  const closeModal = () => {
    setNom("");
    setDescription("");
    setEditMode(false);
    (document.getElementById("category_modal") as HTMLDialogElement)?.close();
  };

  const handleCreateSpecialite = async () => {
    if (!nom || !description) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/specialite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nom, description }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la création.");
      }

      const newSpecialite = await res.json();

      // Met à jour la liste locale avec la nouvelle spécialité
      setSpecialites((prev) => [...prev, newSpecialite]);

      toast.success("Spécialité créée avec succès !");
      closeModal();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpecialite = async () => {
    if (!nom || !description) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    if (!editingCategoryId) {
      toast.error("Aucune spécialité sélectionnée pour la modification.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/specialite", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: editingCategoryId, nom, description }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour.");
      }

      const updatedSpecialite = await res.json();

      // Remplacer la spécialité modifiée dans la liste locale
      setSpecialites((prev) =>
        prev.map((s) => (s.id === updatedSpecialite.id ? updatedSpecialite : s))
      );

      toast.success("Spécialité mise à jour avec succès !");
      closeModal();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (specialite: Specialite) => {
    setNom(specialite.nom);
    setDescription(specialite.description || "");
    setEditMode(true);
    setEditingCategoryId(specialite.id);
    (
      document.getElementById("category_modal") as HTMLDialogElement
    )?.showModal();
  };

  return (
    <Wrapper>
      <div className="overflow-x-auto">
        <div className="flex flex-col">
          <span className="font-bold text-3xl text-primary tracking-wide mb-10">
            Specialités
          </span>
          <div>
            <div className="mb-4">
              <button className="btn btn-primary" onClick={openCreateModal}>
                Ajouter une specialité
              </button>
            </div>

            {specialites.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {specialites.map((specialite: any, index: number) => (
                    <tr key={specialite.id}>
                      <td>{index + 1}</td>
                      <td>{specialite.nom}</td>
                      <td>{specialite.description}</td>
                      <td className="flex gap-2 flex-col">
                        <button
                          className="btn btn-secondary btn-xs w-fit transition duration-200 hover:scale-105 hover:brightness-90 hover:shadow-md"
                          onClick={() => openEditModal(specialite)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-error btn-xs w-fit transition duration-200 hover:scale-105 hover:brightness-90 hover:shadow-md"
                          onClick={() => handleDeleteSpecialite(specialite.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                message={"Aucune spécialité créé"}
                IconComponent="Group"
              />
            )}
          </div>
        </div>
      </div>

      <SpecialiteModal
        nom={nom}
        description={description}
        onChangeNom={setNom}
        onChangeDescription={setDescription}
        onSubmit={editMode ? handleUpdateSpecialite : handleCreateSpecialite}
        onclose={closeModal}
        loading={loading}
        editMode={editMode}
      />
    </Wrapper>
  );
};

export default page;
