import IndiaMapVisualization from "../../../components/d3-india-map";

export default function ChartPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200 p-4">
      <IndiaMapVisualization />
    </div>
  );
}