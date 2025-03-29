import React, { JSX, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

interface GroupedBarChartProps {
  xLabels: string[]; // Array of months (e.g., ["Jan", "Feb", "Mar", ...])
  yLabels: string[]; // Array of areas (e.g., ["Area 1", "Area 2", ..., "Area 19"])
  data: number[][]; // 2D array with data points (19 areas * 12 months)
  width?: number;
  height?: number;
}

interface TooltipState {
  x: number;
  y: number;
  content: JSX.Element;
}

const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
  xLabels,
  yLabels,
  data,
  width = 800,
  height = 900,
}) => {
  const margin = { top: 50, right: 20, bottom: 180, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [highlightedArea, setHighlightedArea] = useState<string | null>(yLabels[0]); // Default to first area selected

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
    .padding(0.1);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(transposedData.flat()) ?? 0])
    .nice()
    .range([innerHeight, 0]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

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

  const toggleHighlight = (areaName: string) => {
    if (highlightedArea === areaName) {
      setHighlightedArea(null); // Reset highlight if the same area is clicked
    } else {
      setHighlightedArea(areaName);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width, height }}>
      <svg width={width} height={height} className="bg-white shadow rounded">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Render bars for each area grouped by month */}
          {transposedData.map((row, rowIndex) =>
            row.map((value, colIndex) => {
              const x = xScale(xLabels[colIndex]) ?? 0;
              const y = yScale(value);
              const barWidth = xScale.bandwidth() / yLabels.length;

              // Highlight the selected area
              const isHighlighted = highlightedArea === yLabels[rowIndex];
              const color = isHighlighted ? "black" : colorScale(yLabels[rowIndex]);
              const opacity = isHighlighted ? 1 : 0.3; // Fade other bars

              return (
                <g key={`${rowIndex}-${colIndex}`} className="group">
                  <rect
                    x={x + rowIndex * barWidth}
                    y={y}
                    width={barWidth}
                    height={innerHeight - y}
                    fill={color}
                    opacity={opacity} // Apply fading effect
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, rowIndex, colIndex, value)
                    }
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  />
                  {isHighlighted && (
                    <text
                      x={x + rowIndex * barWidth + barWidth / 2}
                      y={y - 8} // Adjusted to position above the bar
                      textAnchor="middle"
                      className="text-[12px] fill-black font-semibold"
                    >
                      {value}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* X-axis labels */}
          {xLabels.map((label, index) => {
            const x = xScale(label);
            return (
              <text
                key={`x-${index}`}
                x={x! + xScale.bandwidth() / 2}
                y={innerHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-700"
              >
                {label}
              </text>
            );
          })}

          {/* Y-axis ticks */}
          <g className="axis-y">
            {yScale.ticks().map((tick, index) => (
              <g key={`y-${index}`} transform={`translate(0, ${yScale(tick)})`}>
                <line
                  x1={0}
                  x2={innerWidth}
                  stroke="gray"
                  strokeWidth={0.5}
                />
                <text
                  x={-10}
                  y={0}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-xs fill-gray-700"
                >
                  {tick}
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>

      {/* Tooltip */}
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

      {/* Legends Below the Graph */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          backgroundColor: "white",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          padding: "10px 0",
          boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
        }}
      >
        {yLabels.map((area, index) => {
          const isActive = highlightedArea === area;
          return (
            <button
              key={area}
              onClick={() => toggleHighlight(area)}
              className={`flex items-center space-x-2 p-2 rounded-lg text-xs border border-blue-600 ${
                isActive ? "bg-blue-500 text-white" : "bg-gray-100"
              }`}
              style={{ width: "100px", minWidth: "100px" }}
            >
              <div
                style={{
                  width: "15px",
                  height: "15px",
                  backgroundColor: colorScale(area),
                }}
              ></div>
              <span>{area}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GroupedBarChart;
