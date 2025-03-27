"use client";
import React, { useState, useMemo } from "react";
import { NextPage } from "next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Range } from "react-range";
import { MultiSelect } from "react-multi-select-component";
import HeatMap from "./d3-heatmap";
import GroupedBarChart from "./d3-grouped-barchart";
import { ALL_AREAS, COLORS, mockData } from "../constants";

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Grouped Bar chart start
const xLabels = [
  "2024-04",
  "2024-05",
  "2024-06",
  "2024-07",
  "2024-08",
  "2024-09",
  "2024-10",
  "2024-11",
  "2024-12",
  "2025-01",
  "2025-02",
  "2025-03",
];

const yLabels = [
  "Area 1",
  "Area 2",
  "Area 3",
  "Area 4",
  "Area 5",
  "Area 6",
  "Area 7",
  "Area 8",
  "Area 9",
  "Area 10",
  "Area 11",
  "Area 12",
  "Area 13",
  "Area 14",
  "Area 15",
  "Area 16",
  "Area 17",
  "Area 18",
  "Area 19",
];

const data = xLabels.map(() =>
  yLabels.map(() => Math.floor(Math.random() * 3000))
);
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Grouped Bar chart end

const ChartTogglePage: NextPage = () => {
  const [chartType, setChartType] = useState<"line" | "heatmap" | "groupedbar">(
    "heatmap"
  );

  const [range, setRange] = useState<[number, number]>([0, 5]);

  const [selectedAreas, setSelectedAreas] =
    useState<{ label: string; value: string }[]>(ALL_AREAS);

  const [highlightedArea, setHighlightedArea] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    const [start, end] = range;
    return mockData.slice(start, end + 1);
  }, [range]);

  const selectedAreaValues = useMemo(
    () => selectedAreas.map((area) => area.value),
    [selectedAreas]
  );

  const xLabels = useMemo(
    () => filteredData.map((item) => item.month),
    [filteredData]
  );
  const yLabels = useMemo(
    () => selectedAreas.map((area) => area.label),
    [selectedAreas]
  );
  const originalMatrix: number[][] = useMemo(
    () =>
      selectedAreas.map((area) =>
        filteredData.map((item) => {
          // Default to 0 if missing
          return (item as any)[area.value] || 0;
        })
      ),
    [filteredData, selectedAreas]
  );

  const logMatrix: number[][] = originalMatrix.map((row) =>
    row.map((val) => Math.log(val + 1))
  );
  const maxLog = useMemo(() => Math.max(...logMatrix.flat()), [logMatrix]);

  const handleSliderChange = (values: number[]) => {
    setRange([values[0], values[1]]);
  };
  const aggregatedData = selectedAreaValues.map((areaKey) => {
    const total = filteredData.reduce(
      (sum, item: any) => sum + (item[areaKey] || 0),
      0
    );
    const area = ALL_AREAS.find((a) => a.value === areaKey);
    return { name: area?.label || areaKey, value: total };
  });

  const formatMonth = (index: any) => {
    const date = new Date(mockData[index].month);
    return `${date.toLocaleString("default", { month: "short" })}-${date
      .getFullYear()
      .toString()
      .slice(-2)}`;
  };

  return (
    <div className="p-4 font-sans h-screen">
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 px-4 py-2 rounded bg-gray-800 text-white shadow hover:bg-gray-700"
      >
        Back
      </button>
      <h1 className="text-2xl font-bold mb-4">
        Chart To Observe 19GA Data Points with time and Area Filter
      </h1>

      <div className="mb-4">
        <button
          onClick={() => setChartType("heatmap")}
          disabled={chartType === "heatmap"}
          className={`mr-2 px-4 py-2 rounded shadow ${
            chartType === "heatmap"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Heat Map
        </button>
        <button
          onClick={() => setChartType("groupedbar")}
          disabled={chartType === "groupedbar"}
          className={`mr-2 px-4 py-2 rounded shadow ${
            chartType === "groupedbar"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Grouped Bar Chart
        </button>
      </div>

      <div className="flex space-x-8 mb-4">
        <div className="w-72">
          <h3 className="text-lg font-semibold mb-2">Select Time Frame</h3>

          <Range
            step={1}
            min={0}
            max={11}
            values={range}
            onChange={handleSliderChange}
            renderTrack={({ props, children }) => (
              <div
                {...props}
                className="relative h-2 bg-gray-300 my-4 rounded-lg"
              >
                {children}
              </div>
            )}
            renderThumb={({ props }) => {
              const { key, ...rest } = props;
              return (
                <div
                  key={key}
                  {...rest}
                  className="h-5 w-5 bg-gray-100 rounded-full border-2 border-white cursor-pointer"
                />
              );
            }}
          />
          <p className="text-sm text-gray-700">
            Showing data for Last{" "}
            <span className="font-medium">{`${range[1] + 1} Months`}</span>
          </p>
        </div>

        <div className="mb-4 w-72">
          <h3 className="text-lg font-semibold mb-2">Select Areas</h3>
          <MultiSelect
            options={ALL_AREAS}
            value={selectedAreas}
            onChange={setSelectedAreas}
            labelledBy="Select Areas"
            hasSelectAll
            overrideStrings={{
              selectSomeItems: "Select Areas...",
              allItemsAreSelected: "All Areas Selected",
              selectAll: "Select All",
              search: "Search Areas",
            }}
          />
        </div>
      </div>

      {chartType === "line" ? (
        <div className="h-96 ">
          <ResponsiveContainer width={1000} height={500}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend
                onMouseEnter={(e) => setHighlightedArea(e.value as string)}
                onMouseLeave={() => setHighlightedArea(null)}
              />
              {selectedAreaValues.map((areaKey, index) => (
                <Line
                  key={areaKey}
                  type="monotone"
                  dataKey={areaKey}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={highlightedArea === areaKey ? 3 : 1}
                  opacity={
                    highlightedArea && highlightedArea !== areaKey ? 0.3 : 1
                  }
                  activeDot={{ r: 6 }}
                  onMouseOver={() => setHighlightedArea(areaKey)}
                  onMouseOut={() => setHighlightedArea(null)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : chartType === "heatmap" ? (
        <div className=" overflow-x-auto">
          <HeatMap
            xLabels={xLabels}
            yLabels={yLabels}
            data={data}
            width={1000}
            height={500}
          />
        </div>
      ) : (
        <div className=" overflow-x-auto">
          <GroupedBarChart
            xLabels={xLabels}
            yLabels={yLabels}
            data={data}
            width={1000}
            height={500}
          />
        </div>
      )}
    </div>
  );
};

export default ChartTogglePage;
