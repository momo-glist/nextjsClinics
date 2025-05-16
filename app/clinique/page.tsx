"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // à ne pas oublier

const page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleModuleChange = (moduleName: string) => {
    setModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          adresse,
          telephone,
          modules,
          email, // récupéré de Clerk
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Clinique créée avec succès !");
        // Redirection vers tableau de bord clinique par exemple
        router.push("/");
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (err) {
      console.error(err);
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-base-100 p-8 rounded-2xl shadow-lg w-full max-w-lg space-y-6"
        >
          <h2 className="text-2xl font-bold text-center">Créer une Clinique</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Nom de la clinique</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              placeholder="Ex : Clinique Santé Plus"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Adresse</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              required
              placeholder="Ex : Rue 123, Bamako"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Téléphone</span>
            </label>
            <input
              type="tel"
              className="input input-bordered"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              required
              placeholder="Ex : +223 70 00 00 00"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Modules à activer (facultatif)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {["pharmacie", "laboratoire", "comptabilite"].map((module) => (
                <label key={module} className="cursor-pointer label gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={modules.includes(module)}
                    onChange={() => handleModuleChange(module)}
                  />
                  <span className="label-text capitalize">{module}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Création en cours..." : "Créer la Clinique"}
          </button>
        </form>
      </div>

      <ToastContainer position="top-right" />
    </>
  );
};

export default page;
