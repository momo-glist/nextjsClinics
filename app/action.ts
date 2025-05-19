"use server"

import prisma from "@/lib/prisma";

export async function checkAndAddUtilisateur(email: string, nom: string) {
  if (!email) return;
  try {
    const existingUtilisateur = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!existingUtilisateur && nom) {
      await prisma.user.create({
        data: {
          email,
          nom,
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
}

export async function getUtilisateur(email: string) {
  if (!email) return null;
  try {
    const existingUtilisateur = await prisma.user.findUnique({
      where: { email },
      include: { clinique: true },
    });

    return existingUtilisateur;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getCliniqueWithModulesAndRole(email: string) {
  try {
    // Recherche de l'utilisateur avec sa clinique, modules, et rôle
    const userWithClinique = await prisma.user.findUnique({
      where: { email },
      include: {
        clinique: {
          include: {
            modules: true,
          },
        },
      },
    });

    if (!userWithClinique) return null;

    const nom = userWithClinique.clinique?.nom || null;
    const modules = userWithClinique.clinique?.modules.map((m) => m.nom) || [];
    const role = userWithClinique.role;

    return {
      nom,
      modules,
      role
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de la clinique et modules :", error);
    throw error;
  }
}


