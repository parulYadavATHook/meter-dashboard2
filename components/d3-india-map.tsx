"use client";
import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { cities } from "../constants";

type Mode = "meter" | "energy";

const IndiaMapVisualization: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [mode, setMode] = useState<Mode>("meter");
  const [energyUnit, setEnergyUnit] = useState<"SCM" | "INR">("SCM");

  const width = 800;
  const height = 700;

  useEffect(() => {
    const svgElement = svgRef.current;

    const preventZoom = (e: WheelEvent) => {
      e.preventDefault();
    };

    svgElement?.addEventListener("wheel", preventZoom, { passive: false });

    return () => {
      svgElement?.removeEventListener("wheel", preventZoom);
    };
  }, []);

  useEffect(() => {
    d3.json("/india.geojson")
      .then((data: any) => setGeoData(data))
      .catch((error: any) => console.error("Error loading GeoJSON:", error));
  }, []);

  useEffect(() => {
    if (!geoData) return;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const pathGenerator = d3.geoPath().projection(projection);

    g.append("g")
      .selectAll("path")
      .data(geoData.features as GeoJSON.Feature<GeoJSON.Geometry, any>[]) // Explicit cast
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#e0e0e0")
      .attr("stroke", "#333");

    if (mode === "meter") {
      const meterRadiusScale = d3
        .scaleSqrt()
        .domain([
          d3.min(cities, (d: any) => d.meterInstalled) ?? 0,
          d3.max(cities, (d: any) => d.meterInstalled)!,
        ])
        .range([10, 25]);

      const meterTooltip = d3
        .select("body")
        .append("div")
        .attr("class", "custom-tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "2px solid #ff9900")
        .style("border-radius", "8px")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("box-shadow", "2px 2px 6px rgba(0,0,0,0.2)")
        .style("opacity", 0);

      cities.forEach((city) => {
        const projected = projection(city.coordinates) as [number, number];
        const [cx, cy] = projected;
        const group = g
          .append("g")
          .attr("transform", `translate(${cx}, ${cy})`);

        const radius = meterRadiusScale(city.meterInstalled);
        const commissioned = city.meterCommissioned;
        const pending = city.meterInstalled - city.meterCommissioned;
        const pieData = [
          { label: "Commissioned", value: commissioned },
          { label: "Pending", value: pending },
        ];

        const pie = d3
          .pie<{ label: string; value: number }>()
          .sort(null)
          .value((d) => d.value);
        const arcs = pie(pieData);
        const arcGenerator = d3
          .arc<d3.PieArcDatum<{ label: string; value: number }>>()
          .innerRadius(radius * 0.5)
          .outerRadius(radius);

        group
          .selectAll("path")
          .data(arcs)
          .enter()
          .append("path")
          .attr("d", arcGenerator)

          .attr("fill", (d) =>
            d.data.label === "Commissioned" ? "rgba(34,139,34,0.6)" : "#fe218b"
          );

        group
          .append("circle")
          .attr("r", radius + 2)
          .attr("fill", "none")

          .attr("stroke", "#ff9900")
          .attr("stroke-width", 2);

        group
          .append("text")
          .attr("y", radius + 14)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "500")
          .text(city.name);

        group
          .on("mouseover", function (event) {
            meterTooltip.transition().duration(300).style("opacity", 0.95);
            meterTooltip
              .html(
                `<strong style="color: black;">${city.name}</strong><br/>` +
                  `Installed: <strong style="color: black;">${city.meterInstalled}</strong><br/>` +
                  `Commissioned: <strong style="color: black;">${city.meterCommissioned}</strong><br/>` +
                  `Pending: <strong style="color: black;">${pending}</strong>`
              )
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mousemove", function (event) {
            meterTooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", function () {
            meterTooltip.transition().duration(300).style("opacity", 0);
          });
      });
    } else if (mode === "energy") {
      const maxEnergy = d3.max(cities, (d) =>
        energyUnit === "SCM" ? d.energyConsumption : d.energyConsumptionINR
      )!;
      const bubbleScale = d3.scaleSqrt().domain([0, maxEnergy]).range([5, 30]);

      const energyTooltip = d3
        .select("body")
        .append("div")
        .attr("class", "custom-tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "2px solid steelblue")
        .style("border-radius", "8px")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("color", "black")
        .style("box-shadow", "2px 2px 6px rgba(0,0,0,0.2)")
        .style("opacity", 0);

      const bubbles = g
        .selectAll("circle.energy-bubble")
        .data(cities)
        .enter()
        .append("circle")
        .attr("class", "energy-bubble")
        .attr("cx", (d) => {
          const p = projection(d.coordinates) as [number, number];
          return p[0];
        })
        .attr("cy", (d) => {
          const p = projection(d.coordinates) as [number, number];
          return p[1];
        })
        .attr("r", 0)
        .attr("fill", "rgba(135,206,250,0.5)")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1)
        .transition()
        .duration(1000)
        .attr("r", (d) =>
          bubbleScale(
            energyUnit === "SCM" ? d.energyConsumption : d.energyConsumptionINR
          )
        );

      g.selectAll("circle.energy-bubble")
        .on("mouseover", function (event, d: any) {
          const darkerFill = d3
            .color("rgba(135,206,250,0.5)")!
            .darker(0.9)
            .toString();
          d3.select(this)
            .transition()
            .duration(300)
            .attr(
              "r",
              bubbleScale(
                energyUnit === "SCM"
                  ? d.energyConsumption
                  : d.energyConsumptionINR
              ) * 1.2
            )
            .attr("fill", darkerFill);
          energyTooltip.transition().duration(300).style("opacity", 0.95);
          const value =
            energyUnit === "SCM" ? d.energyConsumption : d.energyConsumptionINR;
          energyTooltip
            .html(
              `<strong style="color: black;">${d.name}</strong><br/><span style="color: gray;">Daily Consumption : </span><br/><strong style="color: black;">${value}</strong> ${energyUnit}`
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mousemove", function (event) {
          energyTooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function (event, d: any) {
          d3.select(this)
            .transition()
            .duration(300)
            .attr(
              "r",
              bubbleScale(
                energyUnit === "SCM"
                  ? d.energyConsumption
                  : d.energyConsumptionINR
              )
            )
            .attr("fill", "rgba(135,206,250,0.5)");
          energyTooltip.transition().duration(300).style("opacity", 0);
        });

      g.selectAll("text.energy-label")
        .data(cities)
        .enter()
        .append("text")
        .attr("class", "energy-label")
        .attr("x", (d) => {
          const p = projection(d.coordinates) as [number, number];
          return p[0];
        })
        .attr("y", (d) => {
          const p = projection(d.coordinates) as [number, number];
          return (
            p[1] +
            bubbleScale(
              energyUnit === "SCM"
                ? d.energyConsumption
                : d.energyConsumptionINR
            ) +
            15
          );
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .text((d) => d.name);
    }

    return () => {
      d3.selectAll(".custom-tooltip").remove();
    };
  }, [geoData, mode, width, height, cities, energyUnit]);

  return (
    <div className="p-4">
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 px-4 py-2 rounded bg-gray-800 text-white shadow hover:bg-gray-700"
      >
        Back
      </button>

      <h1 className="text-2xl font-bold mb-4 text-center sm:text-left text-black">
        India Map Visualization
      </h1>

      <div className="mb-4 flex flex-wrap gap-4 items-center justify-center sm:justify-start">
        <button
          onClick={() => setMode("meter")}
          className={`px-4 py-2 rounded shadow ${
            mode === "meter"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Installed & Commissioned Meters
        </button>
        <button
          onClick={() => setMode("energy")}
          className={`px-4 py-2 rounded shadow ${
            mode === "energy"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Avg. Daily Consumption
        </button>

        {mode === "energy" && (
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start mt-2 sm:mt-0">
            <span className="font-semibold text-gray-800">Unit:</span>
            <button
              onClick={() => setEnergyUnit("SCM")}
              className={`px-3 py-1 rounded shadow ${
                energyUnit === "SCM"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              SCM
            </button>
            <button
              onClick={() => setEnergyUnit("INR")}
              className={`px-3 py-1 rounded shadow ${
                energyUnit === "INR"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              INR
            </button>
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="g-gradient-to-r from-blue-100 to-blue-200"
      />
    </div>
  );
};

export default IndiaMapVisualization;
