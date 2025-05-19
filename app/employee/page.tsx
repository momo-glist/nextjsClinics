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

  return (
    <Wrapper>
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
              >
                Ajouter un Employé
              </button>
            </div>

            {personnels.length > 0 ? (
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
                  {personnels.map((personnel: any, index: number) => (
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
                          ? personnel.specialites.map((s: { nom: string }) => s.nom).join(", ")
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
            ) : (
              <EmptyState
                message={"Aucun employé créé"}
                IconComponent="Group"
              />
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default Page;
