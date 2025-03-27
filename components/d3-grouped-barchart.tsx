import React, { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";

interface GroupedBarChartProps {
  xLabels: string[];
  yLabels: string[];
  data: number[][];
  width?: number;
  height?: number;
}
interface BarData {
  label: string;
  value: number;
}

const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
  xLabels,
  yLabels,
  data,
  width = 800,
  height = 500,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    content: string;
    x: number;
    y: number;
  } | null>(null);

  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxValue = useMemo(() => {
    let max = 0;
    data.forEach((row) =>
      row.forEach((val) => {
        if (val > max) max = val;
      })
    );
    return max;
  }, [data]);

  const xScale = d3
    .scaleBand<string>()
    .domain(xLabels)
    .range([0, innerWidth])
    .padding(0.2);

  const xSubScale = d3
    .scaleBand<string>()
    .domain(yLabels)
    .range([0, xScale.bandwidth()])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([innerHeight, 0]);

  const pastelColors = d3
    .range(yLabels.length)
    .map((i) => d3.hsl((360 / yLabels.length) * i, 1, 0.6).toString());
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(yLabels)
    .range(pastelColors);

  useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => "");

    g.append("g")
      .attr("class", "grid")
      .call(yAxisGrid)
      .selectAll("line")
      .attr("stroke", "rgba(0, 0, 0, 0.1)")
      .attr("stroke-dasharray", "3,3");

    const groups = g
      .selectAll("g.group")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "group")
      .attr("transform", (_, i) => `translate(${xScale(xLabels[i])}, 0)`);

    const bars = groups
      .selectAll("rect")
      .data((d: any, i) => yLabels.map((label, j) => ({ label, value: d[j] })))
      .enter()
      .append("rect")
      .attr("x", (d) => xSubScale(d.label)!)
      .attr("y", (d) => yScale(d.value))
      .attr("width", xSubScale.bandwidth())
      .attr("height", (d) => innerHeight - yScale(d.value))
      .attr("fill", (d) => colorScale(d.label) as string)
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .on("mouseover", function (event, d: BarData) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "black")
          .attr("opacity", 1);
        setTooltip({
          content: `${d.label}: ${d.value}`,
          x: event.pageX,
          y: event.pageY,
        });
      })
      .on("mouseout", function (event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)

          .attr("opacity", 1);
        setTooltip(null);
      });

    const xAxis = d3.axisBottom(xScale);
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "10px");

    const yAxis = d3.axisLeft(yScale).ticks(5);
    g.append("g").call(yAxis).selectAll("text").style("font-size", "10px");
  }, [
    data,
    xLabels,
    yLabels,
    width,
    height,
    innerWidth,
    innerHeight,
    xScale,
    xSubScale,
    yScale,
    colorScale,
  ]);

  return (
    <div>
      <svg ref={svgRef} className="shadow rounded bg-white" />

      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "8px",
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

export default GroupedBarChart;
