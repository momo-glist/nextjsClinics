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

  if (!utilisateur || !utilisateur.clinique) redirect("/clinique");

  return (
    <Wrapper>
      <button className="btn btn-sm btn-primary">test</button>
    </Wrapper>
  );
}


