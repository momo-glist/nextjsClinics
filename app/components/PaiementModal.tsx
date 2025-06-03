import React, { useState } from "react";

export enum Paiement {
  ESPECE = "ESPECE",
  ESPECE_ORANGE_MONEY = "ESPECE_ORANGE_MONEY",
  ESPECE_MOOV_MONEY = "ESPECE_MOOV_MONEY",
  ESPECE_WAVE = "ESPECE_WAVE",
  ORANGE_MONEY = "ORANGE_MONEY",
  MOOV_MONEY = "MOOV_MONEY",
  WAVE = "WAVE",
  COMPTE_BANCAIRE = "COMPTE_BANCAIRE",
}

type PaiementModalProps = {
  show: boolean;
  onClose: () => void;
  onConfirm: (mode: Paiement) => Promise<void> | void;
  selected: Paiement | "";
  setSelected: (value: Paiement | "") => void;
};

const PaiementModal: React.FC<PaiementModalProps> = ({
  show,
  onClose,
  onConfirm,
  selected,
  setSelected,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!show) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(selected as Paiement);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <dialog id="paiement_modal" className="modal modal-open">
      <div className="modal-box">
        <h3 className="text-xl font-bold mb-4">Mode de paiement</h3>

        <select
          className="select select-bordered w-full mb-4"
          value={selected}
          onChange={(e) => setSelected(e.target.value as Paiement)}
        >
          <option value="">Choisir un mode de paiement</option>
          {Object.values(Paiement).map((val) => (
            <option key={val} value={val}>
              {val.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <div className="modal-action">
          <form method="dialog" className="flex gap-2 justify-end">
            <button
              className="btn"
              type="button"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              className={`btn ${isLoading ? "bg-gray-400 cursor-not-allowed" : "btn-primary"}`}
              type="button"
              disabled={!selected || isLoading}
              onClick={handleConfirm}
            >
              {isLoading ? "Chargement..." : "Confirmer"}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default PaiementModal;
