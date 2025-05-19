"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function InvitationAcceptPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nom: "", password: "" });

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError("Token manquant dans l'URL.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/employee/invitation/accept?token=${token}`
        );
        const data = await res.json();

        if (res.ok) {
          setValid(true);
        } else {
          setError(data.error || "Lien d'invitation invalide ou expiré.");
        }
      } catch {
        setError("Erreur de connexion au serveur.");
      }

      setLoading(false);
    }

    verifyToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/employee/invitation/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...formData }),
      });
      if (res.ok) {
        alert("Invitation acceptée, bienvenue !");
        router.push("/sign-in"); // ou une autre page
      } else {
        const data = await res.json();
        alert(`Erreur: ${data.error}`);
      }
    } catch {
      alert("Erreur réseau");
    }
  }

  if (loading) return <p className="text-center">Chargement...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!valid) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Accepter l'invitation
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Nom complet</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Mot de passe</span>
            </label>
            <input
              type="password"
              className="input input-bordered w-full"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Accepter
          </button>
        </form>
      </div>
    </div>
  );
}
