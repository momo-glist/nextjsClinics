// app/page.tsx ou app/(dashboard)/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import  prisma  from "@/lib/prisma"; // <-- Ton client Prisma
import DashboardClient from "./components/Dashboard";
import Wrapper from "./components/Wrapper";

export default async function HomePage() {
  const authUser = await currentUser();
  if (!authUser) redirect("/sign-in");

  // Récupérer le user Prisma à partir de l'email (ou du supabaseUserId si tu préfères)
  const user = await prisma.user.findUnique({
    where: { email: authUser.emailAddresses[0].emailAddress },
  });

  if (!user) {
    // Si l'utilisateur n'existe pas encore dans la base Prisma
    redirect("/unauthorized");
  }

  // Redirection en fonction du rôle
  switch (user.role) {
    case "MEDECIN":
    case "INFIRMIER":
      redirect("/patient");
      break;
    case "ADMIN":
      // Ne rien faire, on affiche le dashboard
      break;
    default:
      redirect("/unauthorized");
  }

  return (
    <Wrapper>
      <DashboardClient />
    </Wrapper>
  );
}
