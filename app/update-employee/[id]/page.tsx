"use client";
import React, { useState, useEffect } from "react";
import Wrapper from "../../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import { FileImage } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import PersonnelImage from "../../components/PersonnelImage";
import { UpdatePersonnelPayload } from "@/app/type";

const Page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const router = useRouter();
  const params = useParams();
  const personnelId = params?.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [specialitesList, setSpecialitesList] = useState<
    { id: number; nom: string }[]
  >([]);
  const [formData, setFormData] = useState<UpdatePersonnelPayload>({
    id: "",
    personnelEmail: "",
    telephone: "",
    role: "MEDECIN",
    nom: "",
    specialiteNom: "",
    image: "",
  });

  useEffect(() => {
    const fetchSpecialites = async () => {
      try {
        const res = await fetch("/api/specialite");
        if (!res.ok) throw new Error("Erreur chargement spécialités");
        const data = await res.json();
        setSpecialitesList(data);
      } catch (error) {
        console.error(error);
        toast.error("Erreur lors du chargement des spécialités");
      }
    };
    fetchSpecialites();
  }, []);

  // 🔄 Récupération des données employé
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const res = await fetch(`/api/employee/${personnelId}`);
        if (!res.ok) throw new Error("Erreur lors du chargement");
        const data = await res.json();

        setFormData((prev) => ({
          ...prev,
          id: data.id,
          nom: data.nom || "",
          personnelEmail: data.email || "",
          telephone: data.telephone || "",
          role: data.role || "MEDECIN",
          specialiteNom:
            data.specialites && data.specialites.length > 0
              ? data.specialites[0].nom
              : "", // récupère le nom de la 1ère spécialité ou vide
          image: data.image || "",
        }));

        if (data.image) {
          setPreviewUrl(data.image);
        }
      } catch (error) {
        console.error(error);
        toast.error("Erreur lors du chargement de l'employé");
      }
    };

    if (personnelId) fetchPersonnel();
  }, [personnelId]);

  useEffect(() => {
    if (formData.role !== "MEDECIN") {
      setFormData((prev) => ({ ...prev, specialiteNom: "" }));
    }
  }, [formData.role]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imagePath = formData.image;

      // Si une nouvelle image est choisie, on l'upload
      if (file) {
        const imageData = new FormData();
        imageData.append("file", file);
        const res = await fetch("/api/uploads", {
          method: "POST",
          body: imageData,
        });
        const uploadRes = await res.json();
        if (!uploadRes.success) {
          throw new Error("Erreur upload");
        }
        imagePath = uploadRes.path;
      }

      const response = await fetch(`/api/employee/${personnelId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, image: imagePath }),
      });

      if (!response.ok) throw new Error("Erreur");

      toast.success("Personnel mis à jour !");
      router.push("/employee");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <Wrapper>
      <div>
        <h1 className="text-2xl font-bold mb-4">Mettre à jour un employé</h1>
        <div className="flex md:flex-row flex-col md:items-center">
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="text-sm font-semibold mb-2">Nom</div>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className="input input-bordered w-full mb-4"
            />
            <div className="text-sm font-semibold mb-2">Email</div>
            <input
              type="text"
              name="personnelEmail"
              value={formData.personnelEmail}
              onChange={handleChange}
              className="input input-bordered w-full mb-4"
            />
            <div className="text-sm font-semibold mb-2">Téléphone</div>
            <input
              type="text"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className="input input-bordered w-full mb-4"
            />
            <div className="text-sm font-semibold mb-2">Rôle</div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input input-bordered w-full mb-4"
            >
              <option value="">Choisir un rôle</option>
              <option value="MEDECIN">Médecin</option>
              <option value="INFIRMIER">Infirmier</option>
              <option value="ADMINISTRATIF">Administratif</option>
            </select>

            {formData.role === "MEDECIN" && (
              <select
                name="specialiteNom"
                value={formData.specialiteNom}
                onChange={handleChange}
                className="input input-bordered w-full mb-4"
              >
                <option value="">Choisir une spécialité</option>
                {specialitesList.map((spec) => (
                  <option key={spec.id} value={spec.nom}>
                    {spec.nom}
                  </option>
                ))}
              </select>
            )}

            <input
              type="file"
              accept="image/*"
              name="image"
              className="file-input file-input-bordered w-full mb-4"
              onChange={handleFileChange}
            />

            <button className="btn btn-primary mt-3" type="submit">
              Mettre à jour
            </button>
          </form>

          {/* Preview image */}
          <div className="flex md:flex-col md:ml-4 mt-4 md:mt-0">
            <div className="md:ml-4 md:w-[300px] mt-4 border-2 border-primary md:h-[300px] p-5 flex justify-center items-center rounded-3xl">
              {previewUrl ? (
                <PersonnelImage
                  src={previewUrl}
                  alt="preview"
                  heightClass="h-40"
                  widthClass="w-40"
                />
              ) : (
                <FileImage strokeWidth={1} className="h-10 w-10 text-primary" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default Page;
