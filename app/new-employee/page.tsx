"use client";

import React, { useState } from "react";
import Wrapper from "../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const Page = () => {
  const { user } = useUser();
  const router = useRouter();

  // Champs du formulaire
  const [nom, setNom] = useState("");
  const [personnelEmail, setPersonnelEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [role, setRole] = useState("");
  const [specialiteNom, setSpecialiteNom] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  // Fonction de création d'employé
  const handleCreateEmploye = async () => {
    if (!nom || !personnelEmail || !role) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }

    try {
      const response = await fetch("/api/employee/invitation/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: personnelEmail,
          role,
          cliniqueId: user?.publicMetadata?.cliniqueId,
          invitedById: user?.id,
          nom,
          telephone,
          specialiteNom,
        }),
      });

      if (response.ok) {
        toast.success("Invitation envoyée avec succès !");
        router.push("/employee");
      } else {
        const { error } = await response.json();
        toast.error(error || "Erreur lors de l'envoi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur inattendue.");
    }
  };

  return (
    <Wrapper>
      <div className="flex justify-center items-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Ajoutez un employé</h1>
          <section className="flex md:flex-row flex-col">
            <div className="space-y-4 md:w-[450px]">
              <input
                type="text"
                name="nom"
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="input input-bordered w-full mb-4"
              />

              <input
                type="email"
                name="personnelEmail"
                placeholder="Email"
                value={personnelEmail}
                onChange={(e) => setPersonnelEmail(e.target.value)}
                className="input input-bordered w-full mb-4"
              />

              <input
                type="text"
                name="telephone"
                placeholder="223 77 10 92 10"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="input input-bordered w-full mb-4"
              />

              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input input-bordered w-full mb-4"
              >
                <option value="">Choisir un rôle</option>
                <option value="MEDECIN">Médecin</option>
                <option value="INFIRMIER">Infirmier</option>
                <option value="ADMINISTRATIF">Administratif</option>
              </select>

              {role === "MEDECIN" && (
                <input
                  type="text"
                  name="specialiteNom"
                  placeholder="Spécialité"
                  value={specialiteNom}
                  onChange={(e) => setSpecialiteNom(e.target.value)}
                  className="input input-bordered w-full mb-4"
                />
              )}

              <input
                type="password"
                name="motdepasse"
                placeholder="Mot de passe (optionnel)"
                value={motdepasse}
                onChange={(e) => setMotdepasse(e.target.value)}
                className="input input-bordered w-full mb-4"
              />

              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full mb-4"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setPhoto(e.target.files[0]);
                  }
                }}
              />

              <button className="btn btn-primary" onClick={handleCreateEmploye}>
                Inviter l'employé
              </button>
            </div>

            <div
              className="md:ml-4 md:w-[300px] mt-4 md:mt-0 border-2 border-primary md:h-[300px] p-5 flex
            justify-center items-center rounded-3xl"
            >
              {/* Preview de la photo si elle est sélectionnée */}
              {photo && (
                <img
                  src={URL.createObjectURL(photo)}
                  alt="Aperçu"
                  className="rounded-lg max-h-60"
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </Wrapper>
  );
};

export default Page;

