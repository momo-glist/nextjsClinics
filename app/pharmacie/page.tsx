"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import EmptyState from "../components/EmptyState";
import { PharmaDashboard } from "../type";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  BanknoteArrowDown,
  PackagePlus,
  Pill,
  ShoppingBasket,
  Wallet,
} from "lucide-react";

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("semaine");
  const [stats, setStats] = useState<PharmaDashboard | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/pharmacie?period=${selectedPeriod}`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Erreur lors du fetch des stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedPeriod]);

  const summaryData = stats
    ? [
        {
          name: "Chiffre d'affaires",
          value: stats.chiffreDaffaire,
          isCurrency: true,
          icon: <Wallet size={18} className="inline mr-2 text-gray-600" />,
        },
        {
          name: "Panier moyen",
          value: stats.panierMoyen,
          isCurrency: true,
          icon: (
            <ShoppingBasket size={18} className="inline mr-2 text-gray-600" />
          ),
        },
        {
          name: "Total des achats",
          value: stats.totalAchat,
          isCurrency: true,
          icon: (
            <BanknoteArrowDown
              size={18}
              className="inline mr-2 text-gray-600"
            />
          ),
        },
        {
          name: "Nombre de ventes",
          value: stats.nombreDeVentes,
          isCurrency: false,
          icon: <PackagePlus size={18} className="inline mr-2 text-gray-600" />,
        },
        {
          name: "Total médicaments vendus",
          value: stats.totalMedVendus,
          isCurrency: false,
          icon: <Pill size={18} className="inline mr-2 text-gray-600" />,
        },
      ]
    : [];

  function formatNumber(value: number): string {
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    } else {
      return value.toString();
    }
  }

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const produitsPagines = stats
    ? stats.produitsFaibles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  const totalPages = stats
    ? Math.ceil(stats.produitsFaibles.length / itemsPerPage)
    : 0;

  return (
    <Wrapper>
      {loading ? (
        <div className="text-center">Chargement...</div>
      ) : !stats ? (
        <EmptyState message="Aucune donnée disponible." IconComponent="Group" />
      ) : (
        <>
          <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 text-primary">
              Tableau de bord
            </h1>

            <div className="flex items-center gap-4 mb-4">
              <label htmlFor="period" className="font-medium text-gray-700">
                Période :
              </label>
              <select
                id="period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="select select-bordered"
              >
                <option value="semaine">Semaine</option>
                <option value="mois">Mois</option>
                <option value="annee">Année</option>
                <option value="tout">Tout</option>
              </select>
            </div>
            <div className="flex justify-start gap-3 flex-wrap">
              {summaryData.map((item, index) => (
                <div
                  key={index}
                  className="card bg-base-100 flex-1 min-w-[200px] max-w-[250px] rounded-xl border border-gray-300"
                  style={{ boxShadow: "none" }}
                >
                  <div className="card-body p-2 text-left">
                    <h2 className="text-xs text-gray-500 flex items-center">
                      {item.icon}
                      {item.name}
                    </h2>
                    <p className="text-xl font-bold text-primary mt-1">
                      {item.isCurrency ? "FCFA " : ""}
                      {formatNumber(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LineChart - Évolution des ventes */}
              <div className="mt-10">
                <h2 className="text-xl font-semibold mb-4">
                  Évolution des ventes
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.evolutionVentes}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="none" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* BarChart - Top Ventes */}
              <div className="mt-10">
                <h2 className="text-xl font-semibold mb-4">Top ventes</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.topVentes}>
                    <XAxis dataKey="nom" axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar
                      dataKey="quantite"
                      fill="#16a34a"
                      radius={[8, 8, 8, 8]}
                      stroke="none"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Table - Produits faibles */}
            <div className="mt-10 overflow-x-auto">
              <h2 className="text-xl font-semibold mb-4">
                Produits faibles en stock
              </h2>
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Quantité restante</th>
                  </tr>
                </thead>
                <tbody>
                  {produitsPagines.map((prod, index) => (
                    <tr key={index}>
                      <td>{prod.nom}</td>
                      <td>{prod.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start items-center mt-4 gap-x-4">
                <button
                  className="btn btn-sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Précédent
                </button>
                <span className="text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </Wrapper>
  );
};

export default Page;
