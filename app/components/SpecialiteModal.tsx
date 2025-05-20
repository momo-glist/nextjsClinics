import React from "react";

interface Props {
  nom: string;
  description: string;
  loading: boolean;
  onclose: () => void;
  onChangeNom: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onSubmit: () => void;
  editMode?: boolean;
}

const SpecialiteModal: React.FC<Props> = ({
  nom,
  description,
  loading,
  onclose,
  onChangeNom,
  onChangeDescription,
  onSubmit,
  editMode
}) => {
  return (
    <dialog id="category_modal" className="modal">
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onclose}
        >
          X
        </button>
        <h3 className="font-bold text-lg mb-4">{editMode ? "Modifier la spécialié" : "Nouvelle spécialié"}</h3>

        <input
          type="text"
          placeholder="Nom"
          value={nom}
          onChange={(e) => onChangeNom(e.target.value)}
          className="input input-bordered w-full mb-4"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          className="input input-bordered w-full mb-4"
        />

        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading
              ? editMode
                ? "Modification..."
                : "Ajout..."
              : editMode
              ? "Modifier"
              : "Ajouter"}
        </button>
      </div>
    </dialog>
  );
};

export default SpecialiteModal;
