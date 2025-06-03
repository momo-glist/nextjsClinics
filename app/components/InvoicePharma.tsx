import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { ArrowDownFromLine, Cross } from "lucide-react";

interface MedicamentVendu {
  nom: string;
  prix_unitaire: number;
  quantite: number;
}

interface Clinique {
  nom: string;
  adresse: string;
  telephone: string;
}

interface InvoicePDFVenteProps {
  date: string;
  produits: MedicamentVendu[];
  mode: string;
  clinique?: Clinique | null;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  return date.toLocaleDateString("fr-FR", options);
}

const InvoicePDFVente = React.forwardRef<HTMLDivElement, InvoicePDFVenteProps>(
  (props, ref) => {
    const { date, produits, clinique, mode } = props;

    const handleDownloadPdf = async () => {
      if (ref && typeof ref !== "function" && ref.current) {
        try {
          const canvas = await html2canvas(ref.current, {
            scale: 3,
            useCORS: true,
          });
          const imgData = canvas.toDataURL("image/png");

          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "A4",
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(`facture-${date}.pdf`);
        } catch (error) {
          console.error("Erreur lors de la génération du PDF :", error);
        }
      }
    };

    return (
      <div className="mt-4 hidden lg:block">
        <div className="border-2 border-dashed border-base-300 rounded-xl p-5 bg-base-100">
          <button
            onClick={handleDownloadPdf}
            className="btn btn-success btn-sm mb-4 flex items-center gap-2"
          >
            <ArrowDownFromLine className="w-4 h-4" />
            Télécharger PDF
          </button>

          <div className="p-4 sm:p-6 md:p-8" ref={ref}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-4">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <div className="bg-success-content text-success rounded-full p-2">
                    <Cross className="h-6 w-6" />
                  </div>
                  <span className="ml-3 font-bold text-2xl italic">
                    In<span className="text-success">Voice</span>
                  </span>
                </div>
                <h1 className="text-3xl font-bold uppercase mt-2">Facture</h1>
              </div>
              <div className="text-right uppercase">
                <p className="badge badge-ghost">Facture</p>
                <p className="my-2">
                  <strong>Date :</strong> {formatDate(date)}
                </p>
              </div>
            </div>

            <div className="my-6 flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <p className="badge badge-ghost mb-2">Émetteur</p>
                <p className="text-sm font-bold italic">
                  {clinique?.nom || "Nom de la Clinique"}
                </p>
                <p className="text-sm text-gray-500 break-words max-w-xs">
                  {clinique?.adresse}
                </p>
              </div>
              <div>
                <p className="badge badge-ghost mb-2">Mode paiement</p>
                <p className="text-sm font-bold italic">
                  {mode || "Èspèce"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Médicament</th>
                    <th>Prix unitaire</th>
                    <th>Quantité</th>
                    <th className="text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map((p, index) => (
                    <tr key={index}>
                      <td className="border border-base-300 px-4 py-2">
                        {p.nom}
                      </td>
                      <td className="border border-base-300 px-4 py-2">
                        {p.prix_unitaire.toFixed(0)} FCFA
                      </td>
                      <td className="border border-base-300 px-4 py-2">
                        {p.quantite}
                      </td>
                      <td className="border border-base-300 px-4 py-2 text-right">
                        {(p.prix_unitaire * p.quantite).toFixed(0)} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="font-bold text-md">
                Total Toutes Taxes Comprises
              </div>
              <div className="px-4 py-2 bg-success text-success-content text-sm md:text-base font-semibold rounded-xl w-fit whitespace-nowrap">
                Total :{" "}
                {produits
                  .reduce((sum, p) => sum + p.prix_unitaire * p.quantite, 0)
                  .toFixed(0)}{" "}
                FCFA
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default InvoicePDFVente;
