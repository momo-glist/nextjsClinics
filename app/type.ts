import { JSX } from "react";

export interface Personnel {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  role: string;
  image: string;
  specialite?: {
    nom: string;
  };
}

export interface CreatePersonnelPayload {
  personnelEmail: string;
  telephone: string;
  role: "MEDECIN" | "INFIRMIER" | "ADMINISTRATIF";
  nom: string;
  motdepasse: string;
  specialiteNom?: string;
  image: string;
};

export interface UpdatePersonnelPayload {
  id: string,
  personnelEmail: string;
  telephone: string;
  role: "MEDECIN" | "INFIRMIER" | "ADMINISTRATIF";
  nom: string;
  specialiteNom?: string;
  image: string;
};

export interface ModuleNom {
  id: string;
  nom: string;
};

export interface Role {
  id: string;
  nom: string;
};

export interface Specialite {
  id: string;
  nom: string;
  description: string
}

export interface Soin {
  id: string;
  nom: string;
  description: string;
  specialite: Specialite | null;
  prix: string
}

export interface Clinique {
  nom: string;
  telephone: string;
  adresse: string;
  id: string;
  statut: boolean;
  utilisateurId: string;
};

export interface Agenda  {
  date: string;
  statut: string;
  agendaSoins: {
    soin: {
      nom: string;
    };
  }[];
};

export interface Patient  {
  id: string,
  nom: string;
  prenom: string;
  agendas: Agenda[];
};

export interface RendezVousAffiche  {
  jour: string;
  heure: string;
  patient: string;
  type: string;
  couleur: string;
  icone: JSX.Element;
  patientId: string;
};

export interface Rdv {
  id: string,
  patient: string;
  date: string;
  soins: string[];
  patientId: string;
}

export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  role: "ADMIN" | "MEDECIN" | "INFIRMIER" | "ADMINISTRATIF" | "AUTRE";
  image?: string;
  telephone?: string;
  // ajoute d’autres propriétés selon ce que tu utilises
}
