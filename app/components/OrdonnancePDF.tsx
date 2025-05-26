// components/OrdonnancePDF.tsx
import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { ArrowDownFromLine, FileText } from "lucide-react";

interface Clinique {
  nom: string;
  adresse: string;
  telephone: string;
}

type OrdonnancePDFProps = {
  nom: string;
  prenom: string;
  adresse: string;
  date: string;
  remarques: string[];
  clinique?: Clinique | null;
};


function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  return date.toLocaleDateString("fr-FR", options);
}

const OrdonnancePDF = React.forwardRef<HTMLDivElement, OrdonnancePDFProps>(
  (props, ref) => {
    const { nom, prenom, adresse, date, remarques, clinique } = props;

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
          pdf.save(`ordonnance-${nom}.pdf`);
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
            Télécharger Ordonnance
          </button>

          <div className="p-4 sm:p-6 md:p-8" ref={ref}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-4">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <div className="bg-info-content text-success rounded-full p-2">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="ml-3 font-bold text-2xl italic">
                    Ord<span className="text-success">onnance</span>
                  </span>
                </div>
                <h1 className="text-3xl font-bold uppercase mt-2">Ordonnance</h1>
              </div>
              <div className="text-right uppercase">
                <p className="badge badge-ghost">Document</p>
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
              <div className="text-right">
                <p className="badge badge-ghost mb-2">Patient</p>
                <p className="text-sm font-bold italic">
                  {prenom} {nom}
                </p>
                <p className="text-sm text-gray-500 break-words max-w-xs">
                  {adresse}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">Remarques / Prescriptions</h2>
              <ul className="list-disc list-inside text-sm space-y-1">
                {remarques.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default OrdonnancePDF;