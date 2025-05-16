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

export async function getClinique(email: string) {
  try {
    // Étape 1 : Vérifier si l'utilisateur est administrateur de la clinique
    const cliniqueViaUtilisateur = await prisma.clinique.findFirst({
      where: {
        administrateur: {
          email: email,
        },
      },
    });

    if (cliniqueViaUtilisateur) {
      return cliniqueViaUtilisateur.nom;
    }

    // Étape 2 : Vérifier s'il fait partie du personnel
    const personnel = await prisma.user.findUnique({
      where: { email },
      include: { clinique: true },
    });

    if (personnel?.clinique) {
      return personnel.clinique.nom;
    }

    // Aucun résultat
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de la clinique :", error);
    throw error;
  }
}
