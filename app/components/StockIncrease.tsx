import React from "react";

interface Props {
  nom: string;
  quantite: string;
  loading: boolean;
  onclose: () => void;
  onChangeNom: (value: string) => void;
  onChangeQuantite: (value: string) => void;
  onSubmit: () => void;
}

const StockIncreaseModal: React.FC<Props> = ({
  nom,
  quantite,
  loading,
  onclose,
  onChangeNom,
  onChangeQuantite,
  onSubmit,
}) => {
  return (
    <dialog id="quantite_modal" className="modal">
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onclose}
        >
          X
        </button>
        <h3 className="font-bold text-lg mb-4">Augmenter le stock</h3>

        <input
          type="text"
          placeholder="Nom"
          value={nom}
          readOnly
          onChange={(e) => onChangeNom(e.target.value)}
          className="input input-bordered w-full mb-4"
        />
        <input
          type="number"
          placeholder="Nouvelle quantité"
          value={quantite}
          onChange={(e) => onChangeQuantite(e.target.value)}
          className="input input-bordered w-full mb-4"
        />

        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={loading}
        >
          Augmenter
        </button>
      </div>
    </dialog>
  );
};

export default StockIncreaseModal;
