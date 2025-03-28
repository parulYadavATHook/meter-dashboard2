import React, { JSX, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

interface HeatmapProps {
  xLabels: string[];
  yLabels: string[];
  data: number[][];
  width?: number;
  height?: number;
}

interface TooltipState {
  x: number;
  y: number;
  content: JSX.Element;
}

const SimpleHeatmap: React.FC<HeatmapProps> = ({
  xLabels,
  yLabels,
  data,
  width = 800,
  height = 400,
}) => {
  const margin = { top: 50, right: 20, bottom: 50, left: 100 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const transposedData = useMemo(() => {
    if (data.length === 0) return [];
    const numMonths = data.length; // 12
    const numAreas = data[0].length; // 19
    const result: number[][] = Array.from(
      { length: numAreas },
      () => new Array(numMonths)
    );
    for (let m = 0; m < numMonths; m++) {
      for (let a = 0; a < numAreas; a++) {
        result[a][m] = data[m][a];
      }
    }
    return result;
  }, [data]);

  const xScale = d3
    .scaleBand<string>()
    .domain(xLabels)
    .range([0, innerWidth])
    .padding(0.05);

  const yScale = d3
    .scaleBand<string>()
    .domain(yLabels)
    .range([0, innerHeight])
    .padding(0.05);

  const maxValue = useMemo(() => {
    return d3.max(transposedData.flat()) ?? 0;
  }, [transposedData]);

  // Recalculate column totals when transposedData changes
  const columnTotals = useMemo(() => {
    if (transposedData.length === 0) return [];
    const numMonths = transposedData[0].length;
    return Array.from({ length: numMonths }, (_, monthIndex) =>
      transposedData.reduce((sum, row) => sum + row[monthIndex], 0)
    );
  }, [transposedData]);

  const colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([0, Math.log(maxValue + 1)]);

  // Color scale for each row (city)
  const rowColorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const handleMouseEnter = (
    e: React.MouseEvent,
    rowIndex: number,
    colIndex: number,
    value: number
  ) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const content = (
        <div>
          <div>
            <b>{yLabels[rowIndex]}</b>
          </div>
          <div>
            Data points: <b>{value}</b>
          </div>
          <div>{xLabels[colIndex]}</div>
        </div>
      );
      setTooltip({ x, y, content });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTooltip((prev) => (prev ? { ...prev, x, y } : null));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width, height }}>
      <svg width={width} height={height} className="bg-white shadow rounded">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Render column totals above each column */}
          {xLabels.map((label, colIndex) => {
            const x = xScale(label);
            if (x === undefined) return null;
            return (
              <text
                key={`total-${colIndex}`}
                x={x + xScale.bandwidth() / 2}
                y={-10}
                textAnchor="middle"
                className="text-xs fill-gray-700"
              >
                {columnTotals[colIndex]}
              </text>
            );
          })}

         
          {transposedData.map((row, rowIndex) =>
            row.map((value, colIndex) => {
              const x = xScale(xLabels[colIndex]);
              const y = yScale(yLabels[rowIndex]);
              if (x === undefined || y === undefined) return null;
              const color = colorScale(Math.log(value + 1));
              const rowColor = rowColorScale(yLabels[rowIndex]); // Get distinct color for each row

              return (
                <g key={`${rowIndex}-${colIndex}`}>
               
                  <rect
                    x={x}
                    y={y}
                    width={xScale.bandwidth()}
                    height={yScale.bandwidth()}
                    fill={rowColor}
                    stroke="white"
                    rx="2"
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, rowIndex, colIndex, value)
                    }
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  />
                  
                  <text
                    x={x + xScale.bandwidth() / 2}
                    y={y + yScale.bandwidth() / 2}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="text-[10px] fill-white font-semibold"
                  >
                    {value}
                  </text>
                </g>
              );
            })
          )}

          {xLabels.map((label, index) => {
            const x = xScale(label);
            if (x === undefined) return null;
            return (
              <text
                key={`x-${index}`}
                x={x + xScale.bandwidth() / 2}
                y={innerHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-700"
              >
                {label}
              </text>
            );
          })}

          {yLabels.map((label, index) => {
            const y = yScale(label);
            if (y === undefined) return null;
            return (
              <text
                key={`y-${index}`}
                x={-10}
                y={y + yScale.bandwidth() / 2}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-xs fill-gray-700"
              >
                {label}
              </text>
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "5px",
            borderRadius: "4px",
            pointerEvents: "none",
            fontSize: "12px",
            whiteSpace: "pre-line",
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default SimpleHeatmap;
