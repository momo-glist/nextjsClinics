"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onCloseAction: () => void;
  nom: string;
  prenom: string;
  age: string;
  phone: string;
  adresse: string;
  soins: string[];
};

export default function PatientModal({
  open,
  onCloseAction,
  nom,
  prenom,
  age,
  phone,
  adresse,
  soins,
}: Props) {
  const modalRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [open]);

  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box w-full max-w-2xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onCloseAction}
        >
          ✕
        </button>

        <h3 className="font-bold text-xl mb-4 text-primary">
          Informations du patient
        </h3>

        <div className="space-y-2">
          <p>
            <strong>Nom :</strong> {prenom} {nom}
          </p>
          <p>
            <strong>Âge :</strong> {age}
          </p>
          <p>
            <strong>Téléphone :</strong> {phone}
          </p>
          <p>
            <strong>Adresse :</strong> {adresse}
          </p>
          <div>
            <strong>Soins reçus :</strong>
            {soins.length > 0 ? (
              <ul className="list-disc ml-6 mt-1">
                {soins.map((soin, idx) => (
                  <li key={idx}>{soin}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Aucun soin enregistré</p>
            )}
          </div>
        </div>

        <div className="mt-6 text-right">
          <button className="btn btn-secondary" onClick={onCloseAction}>
            Fermer
          </button>
        </div>
      </div>
    </dialog>
  );
}
