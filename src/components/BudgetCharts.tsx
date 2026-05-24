/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useCurrency } from "../utils/CurrencyContext";

// Helper to convert polar coordinates to Cartesian for SVG circles/doughnuts
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

interface DoughnutChartProps {
  data: { label: string; value: number; color: string }[];
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({ data }) => {
  const { format } = useCurrency();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm font-medium text-slate-400">
        Gösterilecek veri yok
      </div>
    );
  }

  let accumulatedAngle = 0;

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:flex-row gap-6">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="12" className="opacity-20" />
          {data.map((item, idx) => {
            const percentage = item.value / total;
            const angleLength = percentage * 360;
            if (angleLength <= 0) return null;

            const startAngle = accumulatedAngle;
            const endAngle = accumulatedAngle + angleLength;
            accumulatedAngle = endAngle;

            // Handle full circle edge case
            if (percentage >= 0.999) {
              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="12"
                />
              );
            }

            const pathData = describeArc(50, 50, 38, startAngle, endAngle);
            return (
              <path
                key={idx}
                d={pathData}
                fill="none"
                stroke={item.color}
                strokeWidth="12"
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400 font-semibold uppercase">Toplam</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono text-center px-1">
            {format(total)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs md:text-sm font-medium">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-500 dark:text-slate-400">{item.label}:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
              {format(item.value)} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const { format } = useCurrency();
  const maxVal = Math.max(...data.map(d => Math.abs(d.value)), 100);

  return (
    <div className="flex flex-col gap-4 w-full p-2">
      {data.map((item, idx) => {
        const percentage = Math.min((Math.abs(item.value) / maxVal) * 100, 100);
        return (
          <div key={idx} className="flex flex-col gap-1 w-full scale-100 transition-transform active:scale-[0.99]">
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="font-semibold text-slate-600 dark:text-slate-300">{item.label}</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
                {item.value < 0 ? "-" : ""}{format(Math.abs(item.value))}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-5 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface LineChartProps {
  labels: string[];
  values: number[];
  lineColor: string;
}

export const LineChart: React.FC<LineChartProps> = ({ labels, values, lineColor }) => {
  const { format } = useCurrency();
  const maxVal = Math.max(...values, 100);
  const minVal = Math.min(...values, 0);
  const spread = maxVal - minVal || 1;

  // Viewbox Dimensions
  const w = 400;
  const h = 180;
  const padding = 25;

  const points = values.map((val, idx) => {
    const x = padding + (idx / (values.length - 1 || 1)) * (w - padding * 2);
    const y = h - padding - ((val - minVal) / spread) * (h - padding * 2);
    return { x, y };
  });

  let linePath = "";
  let areaPath = "";

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    areaPath = `M ${points[0].x} ${h - padding}`;
    areaPath += ` L ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      // Curved lines using cubic Bezier
      const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY1 = points[i - 1].y;
      const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY2 = points[i].y;

      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
      areaPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }

    areaPath += ` L ${points[points.length - 1].x} ${h - padding} Z`;
  }

  return (
    <div className="w-full p-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        {/* Shadow definitions for curves */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* X-Grid lines */}
        <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} stroke="#94a3b8" strokeWidth="1" className="opacity-30" />
        <line x1={padding} y1={padding} x2={w - padding} y2={padding} stroke="#94a3b8" strokeWidth="1" className="opacity-10" />

        {/* Filled Path under line */}
        {points.length > 1 && (
          <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-500" />
        )}

        {/* Stroke Line */}
        {points.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}

        {/* Dots over coordinates */}
        {points.map((pt, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#ffffff"
              stroke={lineColor}
              strokeWidth="2.5"
              className="transition-all duration-150 hover:r-[6.5] active:scale-[1.1]"
            />
            <text
              x={pt.x}
              y={pt.y - 10}
              textAnchor="middle"
              className="text-[9px] font-bold fill-slate-700 dark:fill-slate-200 font-mono"
            >
              {format(values[idx])}
            </text>
          </g>
        ))}

        {/* Labels below */}
        {labels.map((lbl, idx) => {
          const x = padding + (idx / (labels.length - 1 || 1)) * (w - padding * 2);
          return (
            <text
              key={idx}
              x={x}
              y={h - 10}
              textAnchor="middle"
              className="text-[9px] font-semibold fill-slate-400 dark:fill-slate-500"
            >
              {lbl}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
