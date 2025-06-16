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
  role: "MEDECIN" | "INFIRMIER" | "ADMIN" | "COMPTABLE" | "PHARMACIEN";
  nom: string;
  motdepasse: string;
  specialiteNom?: string;
  image: string;
};

export interface UpdatePersonnelPayload {
  id: string,
  personnelEmail: string;
  telephone: string;
  role: "MEDECIN" | "INFIRMIER" | "ADMIN" | "COMPTABLE" | "PHARMACIEN";
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
  specialite: Specialite;
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
  age: string;
  telephone: string;
  adresse: string;
  nombreConsultationsConfirmees: number;
  soins: string[];
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

export interface Utilisateur  {
  id: string;
  email: string;
  nom: string;
  image: string | null;
  telephone: string | null;
  role: "ADMIN" | "MEDECIN" | "INFIRMIER";
  clinique?: any;
  createdClinique?: any;
};


export interface DashboardClientProps {
  totalPatients: number;
  totalConsultations: number;
  totalAgenda: number;
};

export interface WeeklyData {
  day: string;
  consultations: number;
};

export interface Doctor {
  name: string;
  specialties: string[];
  consultations: number;
};

export interface SoinData {
  soin: string;
  score: number;
};

export interface PieData {
  name: string;
  value: number;
};

export interface DashboardStats {
  totalPatients: number;
  totalConsultations: number;
  totalAgenda: number;
  totalFacture: number;
  periodicData: { period: string; consultations: number }[];
  doctors: {
    name: string;
    specialties: string[];
    consultations: number;
  }[];
  soinsData: {
    soin: string;
    score: number;
  }[];
  pieData: {
    name: string;
    value: number;
  }[];
};

export interface Stock {
  id: string;
  nom: string;
  forme: string;
  dosage_valeur: number | string;
  dosage_unite: string;
  prix: number;
  quantite: number;
}


export interface PharmaDashboard {
  chiffreDaffaire: number;
  panierMoyen: number;
  totalAchat: number;
  nombreDeVentes: number;
  totalMedVendus: number;
  topVentes: {
    medicamentId: string;
    nom: string;
    quantite: number;
  }[];
  produitsFaibles: {
    id: string;
    nom: string;
    stock: number;
    date_peremption: string;
  }[];
  evolutionVentes: {
    date: string;
    total: number;
  }[];
}

export interface LigneComptaParJour {
  libelle: string;
  categorie: string;
  montant: number;
  date: string;
}

