"use client";
import React, { useEffect, useRef, useState } from "react";
import { Rdv } from "../type";

export default function ModalRendezVousManques({
  rdvs,
  open,
  onCloseAction,
  onReprogrammerAction,
}: {
  rdvs: Rdv[];
  open: boolean;
  onCloseAction: () => void;
  onReprogrammerAction: (rdv: Rdv) => void;
}) {
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
      <div className="modal-box max-w-3xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onCloseAction}
        >
          ✕
        </button>
        <h3 className="font-bold text-xl mb-4">Rendez-vous manqués</h3>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {rdvs.map((rdv, index) => (
            <div key={index} className="border p-3 rounded-md">
              <p className="font-semibold">Patient : {rdv.patient}</p>
              <p className="text-sm">
                Date prévue : {new Date(rdv.date).toLocaleString()}
              </p>
              <p className="text-sm">Soin(s) : {rdv.soins.join(", ")}</p>
              <div className="mt-3 flex gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onReprogrammerAction(rdv)}
                >
                  Reprogrammer
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-right">
          <button className="btn btn-secondary" onClick={onCloseAction}>
            Retour
          </button>
        </div>
      </div>
    </dialog>
  );
}
