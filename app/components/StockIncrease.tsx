import React from "react";

interface Props {
  nom: string;
  forme: string;
  dosage_valeur: string;
  dosage_unite: string;
  quantite: string;
  prixAchat: string;
  prixVente: string;
  fournisseur: string;
  codeBar: string;
  datePeremption: string;
  dateAchat: string;
  loading: boolean;
  onclose: () => void;
  onChangeQuantite: (value: string) => void;
  onChangePrixAchat: (value: string) => void;
  onChangePrixVente: (value: string) => void;
  onChangeFournisseur: (value: string) => void;
  onChangeCodeBar: (value: string) => void;
  onChangeDatePeremption: (value: string) => void;
  onChangeDateAchat: (value: string) => void;
  onSubmit: () => void;
}

const StockIncreaseModal: React.FC<Props> = ({
  nom,
  forme,
  dosage_valeur,
  dosage_unite,
  quantite,
  prixAchat,
  prixVente,
  dateAchat,
  fournisseur,
  codeBar,
  datePeremption,
  loading,
  onclose,
  onChangeQuantite,
  onChangePrixAchat,
  onChangePrixVente,
  onChangeDateAchat,
  onChangeFournisseur,
  onChangeCodeBar,
  onChangeDatePeremption,
  onSubmit,
}) => {
  return (
    <dialog id="quantite_modal" className="modal">
      <div className="modal-box">
        {/* Bouton de fermeture */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onclose}
        >
          ✕
        </button>

        <h3 className="font-bold text-lg mb-4">Nouvelle livraison</h3>

        {/* Nom du médicament (readonly) */}
        <label className="label">
          <span className="label-text font-semibold">Médicament</span>
        </label>
        <input
          type="text"
          value={nom}
          readOnly
          className="input input-bordered w-full mb-3"
        />

        <label className="label">
          <span className="label-text font-semibold">Forme</span>
        </label>
        <input
          type="text"
          value={forme}
          readOnly
          className="input input-bordered w-full mb-3"
        />

        <label className="label">
          <span className="label-text font-semibold">Dosage</span>
        </label>
        <input
          type="text"
          value={dosage_valeur}
          readOnly
          className="input input-bordered w-full mb-3"
        />

        <label className="label">
          <span className="label-text font-semibold">Unité</span>
        </label>
        <input
          type="text"
          value={dosage_unite}
          readOnly
          className="input input-bordered w-full mb-3"
        />

        {/* Quantité */}
        <label className="label">
          <span className="label-text font-semibold">Quantité livrée</span>
        </label>
        <input
          type="number"
          placeholder="Ex : 50"
          value={quantite}
          onChange={(e) => onChangeQuantite(e.target.value)}
          className="input input-bordered w-full mb-3"
        />

        {/* Prix d’achat */}
        <label className="label">
          <span className="label-text font-semibold">
            Prix d’achat unitaire (FCFA)
          </span>
        </label>
        <input
          type="number"
          placeholder="Ex : 150"
          value={prixAchat}
          onChange={(e) => onChangePrixAchat(e.target.value)}
          className="input input-bordered w-full mb-3"
        />
        {/* Prix de vente */}
        <label className="label">
          <span className="label-text font-semibold">
            Prix de vente unitaire (FCFA)
          </span>
        </label>
        <input
          type="number"
          placeholder="Ex : 250"
          value={prixVente}
          onChange={(e) => onChangePrixVente(e.target.value)}
          className="input input-bordered w-full mb-3"
        />

        {/* Date d’achat */}
        <label className="label">
          <span className="label-text font-semibold">Date d’achat</span>
        </label>
        <input
          type="date"
          value={dateAchat}
          onChange={(e) => onChangeDateAchat(e.target.value)}
          className="input input-bordered w-full mb-4"
        />

        {/* Fournisseur */}
        <label className="label">
          <span className="label-text font-semibold">Fournisseur</span>
        </label>
        <input
          type="text"
          placeholder="Ex : Laborex"
          value={fournisseur}
          onChange={(e) => onChangeFournisseur(e.target.value)}
          className="input input-bordered w-full mb-3"
        />

        <label className="label">
          <span className="label-text font-semibold">Code Bare</span>
        </label>
        <input
          type="text"
          placeholder="Ex : Laborex"
          value={codeBar}
          onChange={(e) => onChangeCodeBar(e.target.value)}
          className="input input-bordered w-full mb-3"
        />

        {/* Date de péremption */}
        <label className="label">
          <span className="label-text font-semibold">Date de péremption</span>
        </label>
        <input
          type="date"
          value={datePeremption}
          onChange={(e) => onChangeDatePeremption(e.target.value)}
          className="input input-bordered w-full mb-4"
        />

        {/* Bouton valider */}
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? "Ajout en cours..." : "Ajouter au stock"}
        </button>
      </div>
    </dialog>
  );
};

export default StockIncreaseModal;
