"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import RadialTooltip from "./RadialTooltip";
import {
  User,
  Stethoscope,
  CalendarCheck,
  CircleDollarSign,
} from "lucide-react";
import EmptyState from "./EmptyState";
import { useEffect, useState } from "react";
import { DashboardStats } from "../type";

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        console.log("Données reçues du backend :", data);
        setStats(data);
      } catch (err) {
        console.error("Erreur lors du fetch des stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return (
      <EmptyState
        message={"Le tableau de bord est en chargement"}
        IconComponent="Group"
      />
    );
  }

  const {
    totalPatients,
    totalConsultations,
    totalAgenda,
    totalFacture,
    weeklyData = [],
    doctors = [],
    soinsData = [],
  } = stats;
  console.log(stats.weeklyData);

  function formatNumber(value: number): string {
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    } else {
      return value.toString();
    }
  }

  const pieData: { name: string; value: number }[] = Array.isArray(
    stats?.pieData
  )
    ? stats.pieData
    : [];

  const summaryData = [
    {
      name: "Patients",
      value: totalPatients,
      icon: <User size={18} className="inline mr-2 text-gray-600" />,
      isCurrency: false,
    },
    {
      name: "Consultations",
      value: totalConsultations,
      icon: <Stethoscope size={18} className="inline mr-2 text-gray-600" />,
      isCurrency: false,
    },
    {
      name: "Rendez-vous",
      value: totalAgenda,
      icon: <CalendarCheck size={18} className="inline mr-2 text-gray-600" />,
      isCurrency: false,
    },
    {
      name: "Revenue",
      value: totalFacture,
      icon: (
        <CircleDollarSign size={18} className="inline mr-2 text-gray-600" />
      ),
      isCurrency: true,
    },
  ];

  const colors = ["#10B981", "#34D399", "#059669", "#047857"];

  // Associe une couleur à chaque entrée dans pieData
  const pieDataWithColors = (pieData ?? []).map(
    (item: { name: string; value: number }, index: number) => ({
      ...item,
      fill: colors[index % colors.length],
    })
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-primary">
        Tableau de bord
      </h1>

      <div className="flex justify-start gap-2 flex-wrap">
        {summaryData.map((item, index) => (
          <div
            key={index}
            className="card bg-base-100 flex-1 min-w-[150px] max-w-[180px] rounded-xl border border-gray-300"
            style={{ boxShadow: "none" }}
          >
            <div className="card-body p-4 text-left">
              <h2 className="text-sm text-gray-500 flex items-center">
                {item.icon}
                {item.name}
              </h2>
              <p className="text-2xl font-bold text-primary mt-2">
                {item.isCurrency ? "CFA " : ""}
                {formatNumber(item.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Médecins + Histogramme */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_2.75fr] gap-6">
        {/* Carte Médecins */}
        <div
          className="rounded-xl bg-white border border-gray-300 p-6"
          style={{ boxShadow: "none" }}
        >
          <h2 className="text-xl font-semibold mb-4 text-primary">Médecins</h2>
          <div className="space-y-4">
            {doctors.map((doc: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{doc.name}</p>
                  <p className="text-sm text-gray-500">
                    {doc.specialties.join(", ")}
                  </p>
                </div>
                <span className="badge badge-soft badge-success text-sm font-semibold px-3 py-1 rounded-full">
                  {doc.consultations}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Carte Histogramme */}
        <div
          className="rounded-xl bg-white border border-gray-300 p-6"
          style={{ boxShadow: "none" }}
        >
          <h2 className="text-xl font-semibold mb-4 text-primary">
            Consultations Hebdomadaire
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar
                dataKey="consultations"
                fill="#10B981"
                radius={[8, 8, 8, 8]}
                cursor="transparent"
                stroke="none"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="rounded-xl bg-white border border-gray-300 p-6"
          style={{ boxShadow: "none" }}
        >
          <div className="card-body">
            <h2 className="card-title text-2xl font-semibold mb-4 text-primary">
              Types de soins
            </h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={soinsData}>
                  <PolarGrid stroke="rgba(16,185,129,0.3)" />{" "}
                  <PolarAngleAxis
                    dataKey="soin"
                    stroke="var(--p)"
                    style={{ fontWeight: "600" }}
                  />
                  <Radar
                    dataKey="score"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl bg-white border border-gray-300 p-6"
          style={{ boxShadow: "none" }}
        >
          <h2 className="text-xl font-semibold mb-4 text-primary">
            Patients par spécialité
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart
              innerRadius="30%"
              outerRadius="90%"
              data={pieDataWithColors}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" background={{ fill: "#E5E7EB" }} />
              <Tooltip content={<RadialTooltip />} cursor={false} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
