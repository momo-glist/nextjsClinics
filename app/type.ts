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
  motdepasse: string;
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