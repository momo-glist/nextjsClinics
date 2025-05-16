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
import { checkAndAddUtilisateur, getClinique } from "../action";

const Sidebar = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string | undefined;
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [nomClinique, setNomClinique] = useState<string | null>(null);

  const navLinks = [
    { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/patients", label: "Patients à consulter", icon: Stethoscope },
    { href: "/agenda", label: "Rendez-vous", icon: CalendarClock },
    { href: "/laboratoire", label: "Laboratoire", icon: Microscope },
    { href: "/soins", label: "Soins", icon: Activity },
    { href: "/pharmacie", label: "Pharmacie", icon: Cross },
    { href: "/medicaments", label: "Médicaments", icon: Pill },
    { href: "/historiqueachat", label: "Historique d'achat", icon: History },
    { href: "/employee", label: "Employées", icon: History },
  ];

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    // Appeler getClinique dès que l'email est dispo
    if (email) {
      getClinique(email)
        .then((nom) => {
          setNomClinique(nom);
          if (nom) {
            console.log("Nom de la clinique :", nom);
          } else {
            console.log("Aucune clinique associée à cet email.");
          }
        })
        .catch((error) => {
          console.error("Erreur récupération clinique :", error);
        });
    }
  }, [email]);

  useEffect(() => {
    if (
      isLoaded &&
      user &&
      user.primaryEmailAddress?.emailAddress &&
      user.fullName
    ) {
      checkAndAddUtilisateur(
        user.primaryEmailAddress.emailAddress,
        user.fullName
      );
    }
  }, [isLoaded, user]);

  return (
    <div
      className={`flex flex-col justify-between h-screen menu p-4 bg-base-200 text-base-content transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Partie haute avec menu et liens */}
      <div>
        {/* Header avec bouton toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Hospital className="w-6 h-6 text-primary" />
            {!isCollapsed && (
              <span className="font-bold text-lg">
                {nomClinique ?? "Chargement..."}
              </span>
            )}
          </div>
          <button onClick={toggleSidebar} className="btn btn-sm btn-ghost">
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Liens de navigation */}
        <ul className="space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
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

      {/* Partie basse avec UserButton */}
      <div className="mt-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
};

export default Sidebar;
