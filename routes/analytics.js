import React, { useEffect, useState, useCallback } from "react";
import API from "../api"; // ✅ USE YOUR AXIOS FILE
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function Analytics() {
  const [sourceData, setSourceData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // ================= FETCH =================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ ALL API CALLS
      const [sourceRes, dailyRes, monthlyRes] = await Promise.all([
        API.get(`/analytics/source?year=${year}`),
        API.get(`/analytics/daily?year=${year}`),
        API.get(`/analytics/monthly?year=${year}`)
      ]);

      // ================= SOURCE =================
      setSourceData(sourceRes.data?.data || []);

      // ================= DAILY =================
      const dailyFormatted = (dailyRes.data?.data || []).map((item) => ({
        date: `${item._id.day}/${item._id.month}`,
        leads: item.count
      }));

      setDailyData(dailyFormatted);

      // ================= MONTHLY =================
      const monthlyFormatted = (monthlyRes.data?.data || []).map((item) => ({
        month: `Month ${item._id.month}`,
        leads: item.count
      }));

      setMonthlyData(monthlyFormatted);

    } catch (err) {
      console.error("❌ Analytics Error:", err?.response?.data || err.message);

      if (err?.response?.status === 401) {
        alert("⚠️ Session expired. Login again");
        localStorage.removeItem("token");
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }, [year]);

  // ================= LOAD =================
  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  if (loading) return <h2>Loading Analytics...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Advanced Analytics Dashboard</h2>

      {/* YEAR FILTER */}
      <div style={{ marginBottom: "20px" }}>
        <label>Select Year: </label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>

      {/* PIE CHART */}
      <h3>Leads by Source</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={sourceData}
            dataKey="count"
            nameKey="_id"
            outerRadius={100}
            label
          >
            {sourceData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {/* DAILY GRAPH */}
      <h3>Daily Leads</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="leads" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>

      {/* MONTHLY GRAPH */}
      <h3>Monthly Leads</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="leads" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Analytics;