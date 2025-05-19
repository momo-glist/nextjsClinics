"use client";

import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  CalendarClock,
  Microscope,
  Activity,
  Cross,
  Pill,
  History,
  Hospital,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import {
  checkAndAddUtilisateur,
  getCliniqueWithModulesAndRole,
} from "../action";
import { ModuleNom, Role } from "@prisma/client";

const Sidebar = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string | undefined;
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [nomClinique, setNomClinique] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleNom[]>([]);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (email) {
      getCliniqueWithModulesAndRole(email)
        .then((result) => {
          if (result) {
            const { nom, modules, role } = result;
            setNomClinique(nom);
            setModules(modules);
            setRole(role);
          } else {
            setNomClinique(null);
            setModules([]);
            setRole(null);
          }
        })
        .catch(console.error);
    }
  }, [email]);

  // Construction dynamique des liens selon le rôle et modules
  const navLinks = [
    {
      href: "/",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      requiredModules: [],
      allowedRoles: ["ADMIN"],
    },
    {
      href: "/patient",
      label: "Patients à consulter",
      icon: Stethoscope,
      requiredModules: [],
      allowedRoles: ["ADMIN", "MEDECIN"],
    },
    {
      href: "/agenda",
      label: "Rendez-vous",
      icon: CalendarClock,
      requiredModules: [],
      allowedRoles: ["ADMIN", "MEDECIN"],
    },
    {
      href: "/laboratoire",
      label: "Laboratoire",
      icon: Microscope,
      requiredModules: ["LABORATOIRE"],
      allowedRoles: ["ADMIN"],
    },
    { href: "/soins", label: "Soins", icon: Activity, requiredModules: [], allowedRoles: ["ADMIN"] },
    {
      href: "/pharmacie",
      label: "Pharmacie",
      icon: Cross,
      requiredModules: ["PHARMACIE"],
      allowedRoles: ["ADMIN"],
    },
    {
      href: "/medicaments",
      label: "Médicaments",
      icon: Pill,
      requiredModules: ["PHARMACIE"],
      allowedRoles: ["ADMIN"],
    },
    {
      href: "/historiqueachat",
      label: "Historique d'achat",
      icon: History,
      requiredModules: ["COMPTABILITE"],
      allowedRoles: ["ADMIN"],
    },
    {
      href: "/employee",
      label: "Employées",
      icon: History,
      requiredModules: [],
      allowedRoles: ["ADMIN"],
    }, 
  ];

  const filteredNavLinks = navLinks.filter(({ requiredModules, allowedRoles }) => {
  const hasModules = requiredModules.every((mod) => modules.includes(mod as ModuleNom));
  const hasRole = !allowedRoles || allowedRoles.includes(role as Role);
  return hasModules && hasRole;
});

  return (
    <div
      className={`flex flex-col justify-between h-screen menu p-4 bg-base-200 text-base-content transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Partie haute */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Hospital className="w-6 h-6 text-primary" />
            {!isCollapsed && (
              <span className="font-bold text-lg">
                {nomClinique ?? "Chargement..."}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-sm btn-ghost"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <ul className="space-y-1">
          {filteredNavLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-2 py-2 rounded ${
                    isActive ? "bg-primary text-white" : "hover:bg-base-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Partie basse */}
      <div className="mt-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
};

export default Sidebar;
