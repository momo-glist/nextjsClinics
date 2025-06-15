// Sidebar.tsx
"use client";

import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  CalendarClock,
  PackagePlus,
  Activity,
  Cross,
  Hospital,
  FolderOpen,
  Users,
  Receipt,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useUserContext } from "../context/UserContext";
import { useState } from "react";

const Sidebar = () => {
  const pathname = usePathname();
  const { role, nomClinique, modules, loading } = useUserContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (loading) {
    return 
  }

  const navLinks = [
    {
      href: "/",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      requiredModules: [],
      allowedRoles: ["ADMIN"],
    },
    {
      href: "/rendez-vous",
      label: "Rendez-vous",
      icon: CalendarClock,
      requiredModules: [],
      allowedRoles: ["ADMIN", "MEDECIN", "INFIRMIER"],
    },
    {
      href: "/patients",
      label: "Patients",
      icon: CalendarClock,
      requiredModules: [],
      allowedRoles: ["ADMIN"],
    },
    {
      href: "/patient/create",
      label: "Ajouter un patient",
      icon: Stethoscope,
      requiredModules: [],
      allowedRoles: ["INFIRMIER"],
    },
    { href: "/soins", label: "Soins", icon: Activity, requiredModules: [], allowedRoles: ["ADMIN"] },
    { href: "/specialite", label: "Spécialités", icon: FolderOpen, requiredModules: [], allowedRoles: ["ADMIN"] },
    {
      href: "/pharmacie",
      label: "Pharmacie",
      icon: Cross,
      requiredModules: ["PHARMACIE"],
      allowedRoles: ["ADMIN"],
    },
    {
      href: "/stock",
      label: "Stock de médicaments",
      icon: PackagePlus,
      requiredModules: ["PHARMACIE"],
      allowedRoles: ["PHARMACIEN"],
    },
    {
      href: "/vente",
      label: "Vendre",
      icon: Receipt,
      requiredModules: ["PHARMACIE"],
      allowedRoles: ["PHARMACIEN"],
    },
    {
      href: "/employee",
      label: "Employées",
      icon: Users,
      requiredModules: [],
      allowedRoles: ["ADMIN"],
    },
    {
      href: "/charges",
      label: "Charges",
      icon: Wallet,
      requiredModules: [],
      allowedRoles: ["COMPTABLE"],
    },
  ];

  const filteredNavLinks = navLinks.filter(({ requiredModules, allowedRoles }) => {
    const hasModules = requiredModules.every((mod) => modules.includes(mod));
    const hasRole = !allowedRoles || allowedRoles.includes(role as string);
    return hasModules && hasRole;
  });

  return (
    <div
     className={`flex flex-col justify-between h-screen menu p-4 
    bg-base-200/70 backdrop-blur-md shadow-md border border-base-300/30 rounded-lg 
    text-base-content transition-all duration-300 
    ${isCollapsed ? "w-20" : "w-64"}`}
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

