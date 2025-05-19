import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY); // Mets ta clé API dans .env

export async function sendInvitationEmail(email: string, link: string) {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Invitation à rejoindre la clinique',
      html: `<p>Vous avez été invité à rejoindre notre plateforme. Cliquez sur le lien suivant pour accepter l'invitation :</p>
             <a href="${link}">${link}</a>`,
    });
    console.log(`Email envoyé à ${email}`);
  } catch (error) {
    console.error("Erreur en envoyant l'email :", error);
    throw error; // pour remonter l’erreur si besoin
  }
}

