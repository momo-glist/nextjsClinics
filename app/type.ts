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
  role: "MEDECIN" | "INFIRMIER" | "ADMIN" | "LABORANTIN" | "COMPTABLE" | "PHARMACIEN";
  nom: string;
  motdepasse: string;
  specialiteNom?: string;
  image: string;
};

export interface UpdatePersonnelPayload {
  id: string,
  personnelEmail: string;
  telephone: string;
  role: "MEDECIN" | "INFIRMIER" | "ADMIN" | "LABORANTIN" | "COMPTABLE" | "PHARMACIEN";
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
