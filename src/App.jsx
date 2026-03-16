import { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [pendingAlerts, setPendingAlerts] = useState([]);

  useEffect(() => {
    fetchPrices();
    registerFCM();
    checkPendingNotifications();
  }, []);

  async function checkPendingNotifications() {
    try {
      const { data } = await axios.get(`${API}/api/notifications`);
      if (data.length > 0) setPendingAlerts(data);
    } catch (err) {
      console.warn("Could not fetch pending notifications", err);
    }
  }

  async function fetchPrices() {
    try {
      const { data } = await axios.get(`${API}/api/prices`);
      setPrices(data);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch (err) {
      console.error("Failed to fetch prices", err);
    } finally {
      setLoading(false);
    }
  }

  async function registerFCM() {
    try {
      const { initializeApp } = await import("firebase/app");
      const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

      const app = initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      });

      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
      if (token) await axios.post(`${API}/api/token`, { token });

      onMessage(messaging, (payload) => {
        alert(`${payload.notification.title}\n${payload.notification.body}`);
      });
    } catch (err) {
      console.warn("FCM not available:", err.message);
    }
  }

  const today = prices[0];
  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  const chartData = [...prices].reverse().map((p) => ({
    date: formatDate(p.date),
    "10g Price": p.price10g,
    "5g Price": p.price5g,
  }));

  const isInTargetRange = today?.price5g >= 60000 && today?.price5g <= 70000;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">🪙 Gold Price Notifier</h1>
          <p className="text-gray-400 text-sm mt-1">24K Gold — Kolkata Region</p>
          {lastUpdated && <p className="text-gray-500 text-xs mt-1">Last updated: {lastUpdated}</p>}
        </div>

        {/* Pending Notifications Banner */}
        {pendingAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {pendingAlerts.map((n, i) => (
              <div key={i} className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 flex justify-between items-start">
                <div>
                  <p className="text-yellow-400 font-semibold text-sm">{n.title}</p>
                  <p className="text-gray-300 text-sm mt-1">{n.body}</p>
                </div>
                <button onClick={() => setPendingAlerts(pendingAlerts.filter((_, j) => j !== i))} className="text-gray-500 hover:text-white ml-4 text-lg">✕</button>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 animate-pulse">Fetching latest prices...</p>
        ) : (
          <>
            {/* Today's Price Cards */}
            {today && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-800 rounded-2xl p-5 text-center border border-yellow-500/30">
                  <p className="text-gray-400 text-sm mb-1">Today — 10g (24K)</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    ₹{today.price10g.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className={`rounded-2xl p-5 text-center border ${isInTargetRange ? "bg-green-900 border-green-400" : "bg-gray-800 border-yellow-500/30"}`}>
                  <p className="text-gray-400 text-sm mb-1">Today — 5g (24K)</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    ₹{today.price5g.toLocaleString("en-IN")}
                  </p>
                  {isInTargetRange && (
                    <p className="text-green-400 text-xs mt-1 font-semibold">🎯 In your target range!</p>
                  )}
                </div>
              </div>
            )}

            {/* Price Chart */}
            <div className="bg-gray-800 rounded-2xl p-5 mb-8 border border-gray-700">
              <h2 className="text-lg font-semibold text-yellow-300 mb-4">📈 Last 5 Days Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                    formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  />
                  <Line type="monotone" dataKey="10g Price" stroke="#facc15" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="5g Price" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Price Table */}
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h2 className="text-lg font-semibold text-yellow-300 mb-4">📋 Last 5 Days Price Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-right py-2 pr-4">10g (24K)</th>
                      <th className="text-right py-2 pr-4">5g (24K)</th>
                      <th className="text-right py-2">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((p, i) => {
                      const prev = prices[i + 1];
                      const change = prev ? ((p.price10g - prev.price10g) / prev.price10g * 100).toFixed(2) : null;
                      const formattedDate = new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                      return (
                        <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 pr-4 text-gray-300">{formattedDate}</td>
                          <td className="py-3 pr-4 text-right text-yellow-400 font-medium">
                            ₹{p.price10g.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 pr-4 text-right text-green-400 font-medium">
                            ₹{p.price5g.toLocaleString("en-IN")}
                          </td>
                          <td className={`py-3 text-right font-medium ${change > 0 ? "text-red-400" : change < 0 ? "text-green-400" : "text-gray-400"}`}>
                            {change ? `${change > 0 ? "+" : ""}${change}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="text-center mt-6">
              <button
                onClick={fetchPrices}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 py-2 rounded-full transition"
              >
                🔄 Refresh Prices
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
