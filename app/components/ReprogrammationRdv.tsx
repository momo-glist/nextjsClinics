"use client";
import React, { useEffect, useRef, useState } from "react";
import { Rdv } from "../type";
import { toast } from "react-toastify";

export default function ModalReprogrammationRdv({
  open,
  rdv,
  onCloseAction,
  onSuccess,
}: {
  open: boolean;
  rdv: Rdv | null;
  onCloseAction: () => void;
  onSuccess?: () => void;
}) {
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const [nouvelleDate, setNouvelleDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [open]);

  useEffect(() => {
    if (rdv) {
      setNouvelleDate(rdv.date.slice(0, 16));
    }
  }, [rdv]);

  const handleSubmit = async () => {
    if (!rdv) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/agenda/${rdv.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: nouvelleDate }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erreur lors de la mise à jour");
      }

      toast.success("Rendez-vous reprogrammé avec succès !");
      onCloseAction();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (!rdv) return null;

  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box w-full max-w-lg">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onCloseAction}
        >
          ✕
        </button>
        <h3 className="font-bold text-xl mb-4">Reprogrammer le rendez-vous</h3>

        <p className="mb-2">
          <strong>Patient :</strong> {rdv.patient}
        </p>
        <p className="mb-2">
          <strong>Soin(s) :</strong> {rdv.soins.join(", ")}
        </p>

        <label className="form-control w-full mb-4">
          <span className="label-text mb-1">Nouvelle date et heure</span>
          <input
            type="datetime-local"
            value={nouvelleDate}
            onChange={(e) => setNouvelleDate(e.target.value)}
            className="input input-bordered w-full"
          />
        </label>

        <div className="mt-4 text-right space-x-2">
          <button className="btn btn-secondary" onClick={onCloseAction}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!nouvelleDate || loading}
          >
            {loading ? "Enregistrement..." : "Confirmer"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

