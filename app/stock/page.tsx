"use client";
import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import EmptyState from "../components/EmptyState";
import Link from "next/link";
import { toast } from "react-toastify";
import { Stock } from "../type";

const page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const router = useRouter();

  const [stock, setStock] = useState<Stock[]>([]);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch("/api/stock");
        const rawData = await res.json();
        const transformed = rawData.map((item: any) => ({
          nom: item.catalogueMed?.nom ?? "Inconnu",
          forme: item.catalogueMed?.forme ?? "Inconnue",
          dosage_valeur: item.catalogueMed?.dosage_valeur ?? "N/A",
          dosage_unite: item.catalogueMed?.dosage_unite ?? "",
          prix: item.prix,
          quantite: item.stockLots?.[0]?.quantite ?? 0,
        }));
        console.log(transformed);
        setStock(transformed);
      } catch (error) {
        toast.error("Erreur lors du chargement des médicaments");
        console.error(error);
      }
    };

    fetchStock();
  }, []);

  return (
    <Wrapper>
      <div className="overflow-x-auto">
        <div className="flex flex-col">
          <span className="font-bold text-3xl text-primary tracking-wide mb-10">
            Stock de médicament
          </span>
          <div>
            <div className="mb-4">
              <button
                className="btn btn-primary"
                onClick={() => router.push("/medicament")}
              >
                Ajouter un médicament
              </button>
            </div>
            {stock.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Forme</th>
                    <th>Dosage</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((stok: Stock, index: number) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{stok.nom}</td>
                      <td>{stok.forme}</td>
                      <td>{`${stok.dosage_valeur} ${stok.dosage_unite}`}</td>
                      <td>{stok.quantite}</td>
                      <td>{stok.prix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                message={"Aucun médicament créé"}
                IconComponent="Group"
              />
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default page;
