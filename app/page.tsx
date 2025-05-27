import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Wrapper from "./components/Wrapper";

export default async function Home() {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const utilisateur = await prisma.user.findUnique({
    where: { email: user.emailAddresses[0]?.emailAddress?.toLowerCase() },
    include: { clinique: true, createdClinique: true },
  });

  if (!utilisateur) {
    redirect("/clinique"); // ou une autre page d'erreur si nécessaire
  }

  if (utilisateur.role === "ADMIN") {
    if (!utilisateur.clinique) {
      redirect("/clinique");
    }
    // Continue vers la page admin (celle-ci)
  } else if (
    utilisateur.role === "MEDECIN" ||
    utilisateur.role === "INFIRMIER"
  ) {
    redirect("/patient");
  } else {
    redirect("/unauthorized"); // ou une autre page
  }

  return (
    <Wrapper>
      <button className="btn btn-sm btn-primary">test</button>
    </Wrapper>
  );
}


