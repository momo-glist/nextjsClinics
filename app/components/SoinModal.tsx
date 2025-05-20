import React from "react";
import { Specialite } from "../type";

interface Props {
  nom: string;
  description: string;
  specialite: string;
  prix: string;
  specialites: Specialite[];
  loading: boolean;
  onclose: () => void;
  onChangeNom: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeSpecialite: (value: string) => void;
  onChangePrix: (value: string) => void; 
  onSubmit: () => void;
  editMode?: boolean;
}

const SoinModal: React.FC<Props> = ({
  nom,
  description,
  prix,
  specialite,
  loading,
  onclose,
  onChangeNom,
  onChangeDescription,
  onChangePrix,
  onChangeSpecialite,
  onSubmit,
  editMode,
  specialites
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
        <h3 className="font-bold text-lg mb-4">
          {editMode ? "Modifier la spécialié" : "Nouvelle spécialié"}
        </h3>

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
        <input
          type="number"
          placeholder="Prix"
          value={prix}
          onChange={(e) => onChangePrix(e.target.value)}
          className="input input-bordered w-full mb-4"
        />

        <select
          value={specialite}
          onChange={(e) => onChangeSpecialite(e.target.value)}
          className="select select-bordered w-full mb-4"
        >
          <option value=""> Sélectionner une spécialité </option>
          {specialites.map((spec) => (
            <option key={spec.id} value={spec.id}>
              {spec.nom}
            </option>
          ))}
        </select>

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

export default SoinModal;
