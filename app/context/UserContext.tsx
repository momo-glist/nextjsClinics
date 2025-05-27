// context/UserContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Role } from "@prisma/client";
import { getCliniqueWithModulesAndRole } from "../action"; // ajuste le chemin si besoin

export type ModuleNom = string;

interface UserContextType {
  role: Role | null;
  nomClinique: string | null;
  modules: ModuleNom[];
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  role: null,
  nomClinique: null,
  modules: [],
  loading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<Role | null>(null);
  const [nomClinique, setNomClinique] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleNom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user?.primaryEmailAddress?.emailAddress) {
      const email = user.primaryEmailAddress.emailAddress;
      getCliniqueWithModulesAndRole(email)
        .then((result) => {
          if (result) {
            setRole(result.role);
            setModules(result.modules);
            setNomClinique(result.nom);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isLoaded, user]);

  return (
    <UserContext.Provider value={{ role, nomClinique, modules, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
