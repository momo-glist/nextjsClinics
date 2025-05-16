import { currentUser } from "@clerk/nextjs/server"; // serveur-side auth
import { redirect } from "next/navigation";
import { getUtilisateur } from "./action";
import Wrapper from "./components/Wrapper";


export default async function Home() {
    const user = await currentUser(); // Clerk user

  if (!user || !user.emailAddresses[0]?.emailAddress) {
    redirect("/sign-in"); // si l'utilisateur n'est pas connecté
  }

  const email = user.emailAddresses[0].emailAddress;
  const utilisateur = await getUtilisateur(email);

  if (!utilisateur) {
    redirect("/clinique"); // si l'utilisateur n'existe même pas encore
  }

  // Redirection si l'utilisateur n'a pas encore créé de clinique
  if (!utilisateur.clinique) {
    redirect("/clinique");
  }
  return (
    <Wrapper>
      <button className="btn btn-sm btn-primary">test</button>
    </Wrapper>
  );
}
