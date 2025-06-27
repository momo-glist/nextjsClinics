"use client";
import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import EmptyState from "../components/EmptyState";
import { toast } from "react-toastify";
import { Stock } from "../type";
import { SquarePlus } from "lucide-react";
import StockIncreaseModal from "../components/StockIncrease";

const page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const router = useRouter();
  const [stock, setStock] = useState<Stock[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch("/api/stock");
        const rawData = await res.json();
        console.log(rawData);
        const transformed = rawData.map((item: any) => ({
          id: item.catalogueMed?.id ?? "Inconnu",
          nom: item.catalogueMed?.nom ?? "Inconnu",
          forme: item.catalogueMed?.forme ?? "Inconnue",
          dosage_valeur: item.catalogueMed?.dosage_valeur ?? "N/A",
          dosage_unite: item.catalogueMed?.dosage_unite ?? "",
          prix: item.prix,
          quantite: item.stockLots?.[0]?.quantite ?? 0,
        }));
        setStock(transformed);
      } catch (error) {
        toast.error("Erreur lors du chargement des médicaments");
        console.error(error);
      }
    };

    fetchStock();
  }, []);

  const getQuantiteClass = (quantite: number) => {
    if (quantite <= 10) return "bg-red-200 text-red-800 font-bold";
    if (quantite <= 50) return "bg-yellow-200 text-yellow-800 font-semibold";
    return "";
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calcul des patients à afficher
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = stock.slice(indexOfFirstItem, indexOfLastItem);

  // Nombre total de pages
  const totalPages = Math.ceil(stock.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <Wrapper>
      {stock.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="flex flex-col">
            <span className="font-bold text-3xl text-primary tracking-wide mb-10">
              Stock de médicament
            </span>
            <div>
              <div className="mb-4 flex gap-4 items-center">
                <button
                  className="btn btn-primary"
                  onClick={() => router.push("/medicament")}
                >
                  Ajouter un médicament
                </button>

                <input
                  type="text"
                  placeholder="Rechercher un médicament..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered w-full max-w-xs"
                />
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Forme</th>
                    <th>Dosage</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Augmenter le stock</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPatients
                    .slice()
                    .sort((a, b) => a.quantite - b.quantite)
                    .filter((item) =>
                      item.nom.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((stock: Stock, index: number) => (
                      <tr key={stock.id}>
                        <td>{index + 1}</td>
                        <td>{stock.nom}</td>
                        <td>{stock.forme}</td>
                        <td>{`${stock.dosage_valeur} ${stock.dosage_unite}`}</td>
                        <td className={getQuantiteClass(stock.quantite)}>
                          {stock.quantite}
                        </td>
                        <td>{stock.prix}</td>
                        <td>
                          <button
                            className="btn btn-xs w-fit btn-primary"
                            onClick={() =>
                              router.push(`/update-stock/${stock.id}`)
                            }
                          >
                            <SquarePlus className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-start items-center mt-4 gap-x-4">
              <button
                className="btn btn-sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Précédent
              </button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                className="btn btn-sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState message={"Aucun médicament créé"} IconComponent="Group" />
      )}
    </Wrapper>
  );
};

export default page;
