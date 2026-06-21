"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

// ApexCharts acessa window — carrega só no cliente.
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/**
 * Wrapper que só renderiza o gráfico após o mount no cliente. Evita o erro
 * "Cannot read properties of null (reading 'node')" causado pelo
 * monta/desmonta do StrictMode no react-apexcharts.
 */
function Chart(props: {
  type: "area" | "donut" | "bar";
  height: number;
  options: ApexOptions;
  series: NonNullable<ApexOptions["series"]>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ height: props.height }} aria-hidden />;
  return (
    <ReactApexChart type={props.type} height={props.height} options={props.options} series={props.series} />
  );
}

/* Paleta alinhada ao tema (tailwind.config). */
export const FLAME = "#FF5A1F";
export const INK = "#23272F";
const GRID = "#E7E3DC";
const AXIS = "#A8A096";
export const PALETTE = ["#FF5A1F", "#23272F", "#1F9D55", "#D9920B", "#D92D20", "#FF9B6E", "#6B7280", "#4B5360"];

type Row = Record<string, string | number>;

const ANIM: ApexOptions["chart"] = {
  fontFamily: "inherit",
  toolbar: { show: false },
  animations: { enabled: true, speed: 700, animateGradually: { enabled: true, delay: 120 } },
};

function shortDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}
function compact(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function truncate(s: string) {
  return s.length > 24 ? `${s.slice(0, 24)}…` : s;
}

/** Tendência por dia (área com gradiente). xKey deve ser data YYYY-MM-DD. */
export function AreaTrend({
  data,
  xKey,
  yKey,
  color = FLAME,
  valueFormatter,
  valueLabel,
}: {
  data: Row[];
  xKey: string;
  yKey: string;
  color?: string;
  gradientId?: string;
  valueFormatter: (v: number) => string;
  valueLabel: string;
}) {
  const options: ApexOptions = {
    chart: { ...ANIM, type: "area", sparkline: { enabled: false } },
    colors: [color],
    stroke: { curve: "smooth", width: 2.5 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, stops: [0, 100] },
    },
    dataLabels: { enabled: false },
    grid: { borderColor: GRID, strokeDashArray: 4, xaxis: { lines: { show: false } }, padding: { left: 8, right: 8 } },
    xaxis: {
      categories: data.map((d) => shortDate(String(d[xKey]))),
      tickAmount: 6,
      labels: { style: { colors: AXIS, fontSize: "11px" }, hideOverlappingLabels: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { style: { colors: AXIS, fontSize: "11px" }, formatter: (v) => compact(Number(v)) } },
    tooltip: { y: { formatter: (v) => valueFormatter(Number(v)) } },
  };
  return (
    <Chart
      type="area"
      height={250}
      options={options}
      series={[{ name: valueLabel, data: data.map((d) => Number(d[yKey])) }]}
    />
  );
}

/** Rosca genérica. colors casa por índice (cai na PALETTE se faltar). */
export function Donut({
  data,
  valueKey,
  nameKey,
  colors,
  valueFormatter = (v) => String(v),
}: {
  data: Row[];
  valueKey: string;
  nameKey: string;
  colors?: string[];
  valueFormatter?: (v: number) => string;
}) {
  const options: ApexOptions = {
    chart: { ...ANIM, type: "donut" },
    labels: data.map((d) => capitalize(String(d[nameKey]))),
    colors: colors ?? PALETTE,
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: { position: "bottom", fontSize: "12px", markers: { size: 6 }, itemMargin: { horizontal: 8 } },
    plotOptions: { pie: { donut: { size: "62%" } } },
    tooltip: { y: { formatter: (v) => valueFormatter(Number(v)) } },
  };
  return (
    <Chart
      type="donut"
      height={250}
      options={options}
      series={data.map((d) => Number(d[valueKey]))}
    />
  );
}

/** Barras horizontais genéricas. */
export function HBars({
  data,
  categoryKey,
  valueKey,
  color = FLAME,
  valueFormatter = (v) => String(v),
  valueLabel,
}: {
  data: Row[];
  categoryKey: string;
  valueKey: string;
  color?: string;
  valueFormatter?: (v: number) => string;
  valueLabel: string;
}) {
  const options: ApexOptions = {
    chart: { ...ANIM, type: "bar" },
    colors: [color],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: "end", barHeight: "55%" } },
    dataLabels: { enabled: false },
    grid: { borderColor: GRID, strokeDashArray: 4, yaxis: { lines: { show: false } } },
    xaxis: {
      categories: data.map((d) => truncate(String(d[categoryKey]))),
      labels: { style: { colors: AXIS, fontSize: "11px" }, formatter: (v) => compact(Number(v)) },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#403B35", fontSize: "11px" }, maxWidth: 160 } },
    tooltip: { y: { formatter: (v) => valueFormatter(Number(v)) } },
  };
  return (
    <Chart
      type="bar"
      height={Math.max(210, data.length * 58)}
      options={options}
      series={[{ name: valueLabel, data: data.map((d) => Number(d[valueKey])) }]}
    />
  );
}
