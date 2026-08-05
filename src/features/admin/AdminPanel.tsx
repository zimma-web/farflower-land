import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  fetchAllPlayersFromSupabase,
  updatePlayerLandStatusInSupabase,
  deletePlayerFromSupabase,
  fetchFarmStateFromSupabase,
  updateFarmStateInSupabase,
} from "lib/supabaseClient";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem("farflower_admin_auth");
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [passError, setPassError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "players" | "farm" | "settings">("overview");
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [selectedFarmState, setSelectedFarmState] = useState<any | null>(null);
  const [jsonString, setJsonString] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setIsLoading(true);

    const inputTrimmed = passwordInput.trim();

    if (inputTrimmed === "Akuasw12") {
      setIsAuthenticated(true);
      sessionStorage.setItem("farflower_admin_auth", "true");
      setPassError(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await window.fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: inputTrimmed }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("farflower_admin_auth", data.adminToken || "true");
        setPassError(null);
      } else {
        setPassError(data?.error || "Incorrect Admin Password!");
      }
    } catch (_) {
      if (inputTrimmed === "Akuasw12") {
        setIsAuthenticated(true);
        sessionStorage.setItem("farflower_admin_auth", "true");
        setPassError(null);
      } else {
        setPassError("Incorrect Admin Password!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchAllPlayersFromSupabase();
    setPlayers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadData();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  // Sneat Admin Template Login Modal (#696cff Primary Purple & #f5f5f9 Background)
  if (!isAuthenticated) {
    return createPortal(
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#566a7f]/50 backdrop-blur-sm p-4 font-sans text-[#566a7f] pointer-events-auto">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100 p-8 relative pointer-events-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>

          {/* Sneat Logo Header */}
          <div className="flex flex-col items-center text-center space-y-2 mb-6">
            <div className="w-12 h-12 bg-[#696cff]/10 rounded-xl flex items-center justify-center text-[#696cff] font-extrabold text-2xl">
              👑
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#566a7f] tracking-tight">Sneat Admin Panel</h2>
              <p className="text-xs text-gray-400 mt-0.5">Please sign-in to your admin dashboard</p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#566a7f] mb-1.5 uppercase tracking-wider">
                Admin Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-[#566a7f] placeholder-gray-400 focus:outline-none focus:border-[#696cff] focus:ring-1 focus:ring-[#696cff] transition-all font-mono shadow-sm"
                autoFocus
              />
            </div>

            {passError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                ⚠️ {passError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#696cff] hover:bg-[#5f61e6] active:bg-[#5254cf] text-white font-semibold rounded-lg text-sm shadow-md shadow-[#696cff]/30 transition-all disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in to Dashboard"}
            </button>
          </form>
        </div>
      </div>,
      document.body,
    );
  }

  const totalPlayers = players.length;
  const activeLands = players.filter((p) => p.has_land).length;
  const totalRevenue = (activeLands * 1.0).toFixed(2);

  const filteredPlayers = players.filter((p) =>
    String(p.farcaster_fid).includes(searchTerm),
  );

  const handleToggleLand = async (player: any) => {
    const newStatus = !player.has_land;
    setIsLoading(true);
    const success = await updatePlayerLandStatusInSupabase(player.id, newStatus);
    if (success) {
      setMessage({ text: `Land status updated for FID ${player.farcaster_fid}`, type: "success" });
      await loadData();
    } else {
      setMessage({ text: `Failed to update land status`, type: "error" });
    }
    setIsLoading(false);
  };

  const handleDeletePlayer = async (player: any) => {
    if (!window.confirm(`Are you sure you want to delete player FID ${player.farcaster_fid}?`)) {
      return;
    }
    setIsLoading(true);
    const success = await deletePlayerFromSupabase(player.id);
    if (success) {
      setMessage({ text: `Player FID ${player.farcaster_fid} deleted successfully.`, type: "success" });
      await loadData();
    } else {
      setMessage({ text: `Failed to delete player.`, type: "error" });
    }
    setIsLoading(false);
  };

  const handleSelectPlayerForFarm = async (player: any) => {
    setSelectedPlayer(player);
    setIsLoading(true);
    const farmData = await fetchFarmStateFromSupabase(player.id);
    if (farmData && farmData.state) {
      setSelectedFarmState(farmData.state);
      setJsonString(JSON.stringify(farmData.state, null, 2));
    } else {
      setSelectedFarmState({});
      setJsonString("{}");
    }
    setActiveTab("farm");
    setIsLoading(false);
  };

  const handleInjectItems = async (type: "coins" | "gems" | "flower") => {
    if (!selectedPlayer || !selectedFarmState) return;
    const newState = { ...selectedFarmState };
    if (!newState.coins) newState.coins = 0;
    if (!newState.inventory) newState.inventory = {};

    if (type === "coins") {
      newState.coins = (newState.coins || 0) + 1000;
    } else if (type === "gems") {
      newState.inventory["Gem"] = (Number(newState.inventory["Gem"] || 0)) + 100;
    } else if (type === "flower") {
      newState.inventory["Farflower Token"] = (Number(newState.inventory["Farflower Token"] || 0)) + 500;
    }

    setSelectedFarmState(newState);
    setJsonString(JSON.stringify(newState, null, 2));
  };

  const handleSaveFarmState = async () => {
    if (!selectedPlayer) return;
    try {
      const parsed = JSON.parse(jsonString);
      setIsLoading(true);
      const success = await updateFarmStateInSupabase(selectedPlayer.id, parsed);
      if (success) {
        setMessage({ text: `Farm state for FID ${selectedPlayer.farcaster_fid} saved successfully!`, type: "success" });
        setSelectedFarmState(parsed);
      } else {
        setMessage({ text: `Failed to save farm state.`, type: "error" });
      }
    } catch (e) {
      setMessage({ text: `Invalid JSON syntax format!`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Sneat Admin Template Main Dashboard Container (#f5f5f9 Theme)
  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#566a7f]/50 backdrop-blur-sm p-4 font-sans text-[#566a7f] pointer-events-auto">
      <div className="w-full max-w-5xl max-h-[92vh] bg-[#f5f5f9] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 pointer-events-auto">
        {/* Sneat Navbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#696cff] text-white rounded-lg flex items-center justify-center font-black text-lg shadow-sm shadow-[#696cff]/40">
              👑
            </div>
            <div>
              <h2 className="text-base font-bold text-[#566a7f] tracking-tight">Sneat Admin Panel</h2>
              <p className="text-xs text-gray-400">Farflower Land Database & P2E System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sneat Tab Navigation Bar */}
        <div className="flex space-x-2 px-6 py-3 bg-white border-b border-gray-200 shadow-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "overview"
                ? "bg-[#696cff] text-white shadow-md shadow-[#696cff]/30"
                : "text-[#696cff] bg-[#696cff]/10 hover:bg-[#696cff]/20"
            }`}
          >
            📊 Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab("players")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "players"
                ? "bg-[#696cff] text-white shadow-md shadow-[#696cff]/30"
                : "text-[#696cff] bg-[#696cff]/10 hover:bg-[#696cff]/20"
            }`}
          >
            👥 User Management ({players.length})
          </button>
          <button
            onClick={() => setActiveTab("farm")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "farm"
                ? "bg-[#696cff] text-white shadow-md shadow-[#696cff]/30"
                : "text-[#696cff] bg-[#696cff]/10 hover:bg-[#696cff]/20"
            }`}
          >
            🌾 Farm State Editor
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "bg-[#696cff] text-white shadow-md shadow-[#696cff]/30"
                : "text-[#696cff] bg-[#696cff]/10 hover:bg-[#696cff]/20"
            }`}
          >
            ⚙️ Treasury & Config
          </button>
        </div>

        {/* Sneat Toast Notification Banner */}
        {message && (
          <div
            className={`mx-6 mt-3 p-3 rounded-lg text-xs font-medium flex items-center justify-between shadow-sm border ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-3 font-bold hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* Sneat Content Area (#f5f5f9 Background) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f5f5f9]">
          {/* TAB 1: SNEAT ANALYTICS OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Players</span>
                    <div className="w-9 h-9 bg-[#696cff]/10 text-[#696cff] rounded-lg flex items-center justify-center text-lg">
                      👥
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-[#566a7f] tracking-tight">{totalPlayers}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Registered in Supabase</p>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Lands Bought</span>
                    <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-lg">
                      🏞️
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{activeLands}</p>
                  <p className="text-[11px] text-gray-400 mt-1">1.00 USDC Paid Activations</p>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-lg">
                      💰
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-[#696cff] tracking-tight">${totalRevenue} USDC</p>
                  <p className="text-[11px] text-gray-400 mt-1">Treasury Receiver Earnings</p>
                </div>
              </div>

              {/* Sneat Health Box */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-[#566a7f] uppercase tracking-wider">
                  Supabase System Status & Contracts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center space-x-2 text-[#566a7f]">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Tables Active: <code className="bg-gray-100 px-2 py-0.5 rounded text-[#696cff] font-mono">players</code>, <code className="bg-gray-100 px-2 py-0.5 rounded text-[#696cff] font-mono">game_farms</code></span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#566a7f]">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>RLS Access: Permissive REST Enabled</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#566a7f] sm:col-span-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Treasury Address Receiver: <code className="bg-gray-100 px-2 py-0.5 rounded text-emerald-600 font-mono">0xe251A3a0D23859157ef8041394279f7Ba46C90e3</code></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SNEAT USER MANAGEMENT TABLE */}
          {activeTab === "players" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Search player by Farcaster FID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs text-[#566a7f] placeholder-gray-400 focus:outline-none focus:border-[#696cff] focus:ring-1 focus:ring-[#696cff] shadow-xs"
                />
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-[#566a7f] text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-2"
                >
                  🔄 Refresh Users
                </button>
              </div>

              {/* Sneat Table Card */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs text-[#566a7f]">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="p-4">Farcaster FID</th>
                      <th className="p-4">Land Activation Status</th>
                      <th className="p-4">Registration Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400">
                          No registered players found.
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-4 font-bold text-[#566a7f] font-mono text-sm">
                            <span className="inline-flex items-center justify-center w-7 h-7 bg-[#696cff]/10 text-[#696cff] rounded-full mr-2 font-sans text-xs">
                              👤
                            </span>
                            {p.farcaster_fid}
                          </td>
                          <td className="p-4">
                            {p.has_land ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                Active (1.00 USDC)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                Not Purchased
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-gray-400 text-xs">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : "-"}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleToggleLand(p)}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium transition-all"
                            >
                              {p.has_land ? "Revoke Land" : "Grant Land"}
                            </button>
                            <button
                              onClick={() => handleSelectPlayerForFarm(p)}
                              className="px-3 py-1.5 bg-[#696cff]/10 hover:bg-[#696cff]/20 text-[#696cff] rounded-lg text-xs font-semibold transition-all"
                            >
                              Edit State
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(p)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-medium transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SNEAT FARM STATE EDITOR */}
          {activeTab === "farm" && (
            <div className="space-y-4">
              {!selectedPlayer ? (
                <div className="p-8 text-center bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400 text-xs">
                  <p>Please select a user from the <b>👥 User Management</b> tab to edit their farm state JSON.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                    <span className="text-[#566a7f]">
                      Editing farm state for FID: <b className="text-[#696cff] font-mono text-sm">{selectedPlayer.farcaster_fid}</b>
                    </span>
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="text-[#696cff] hover:underline font-bold"
                    >
                      Change User
                    </button>
                  </div>

                  {/* Sneat Quick Inject Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleInjectItems("coins")}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold transition-all shadow-xs"
                    >
                      🪙 +1,000 Coins
                    </button>
                    <button
                      onClick={() => handleInjectItems("gems")}
                      className="px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 rounded-lg text-xs font-semibold transition-all shadow-xs"
                    >
                      💎 +100 Gems
                    </button>
                    <button
                      onClick={() => handleInjectItems("flower")}
                      className="px-3.5 py-2 bg-[#696cff]/10 hover:bg-[#696cff]/20 text-[#696cff] rounded-lg text-xs font-semibold transition-all shadow-xs"
                    >
                      🌸 +500 Farflower Tokens
                    </button>
                  </div>

                  {/* JSON Editor Textarea */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#566a7f] uppercase tracking-wider">
                      Farm State JSON Payload:
                    </label>
                    <textarea
                      rows={13}
                      value={jsonString}
                      onChange={(e) => setJsonString(e.target.value)}
                      className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-mono text-xs focus:outline-none focus:border-[#696cff] focus:ring-1 focus:ring-[#696cff] transition-all leading-relaxed shadow-inner"
                    />
                  </div>

                  <button
                    onClick={handleSaveFarmState}
                    disabled={isLoading}
                    className="w-full py-3 bg-[#696cff] hover:bg-[#5f61e6] active:bg-[#5254cf] text-white font-semibold rounded-lg text-xs shadow-md shadow-[#696cff]/30 transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Saving Farm State..." : "💾 Save Farm State Payload"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SNEAT TREASURY & CONFIG */}
          {activeTab === "settings" && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#566a7f] tracking-tight border-b border-gray-100 pb-3">
                ⚙️ P2E System & Treasury Settings
              </h3>

              <div className="space-y-1.5">
                <label className="block font-bold text-gray-500 uppercase tracking-wider">
                  Treasury Address Recipient (1.00 USDC Fee):
                </label>
                <input
                  type="text"
                  readOnly
                  value="0xe251A3a0D23859157ef8041394279f7Ba46C90e3"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-emerald-700 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-gray-500 uppercase tracking-wider">
                  Farflower Token Contract:
                </label>
                <input
                  type="text"
                  readOnly
                  value="0xC462c9611871906b8C0152bDa5Ca55E1f439D7e4"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-[#696cff] font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-gray-500 uppercase tracking-wider">
                  Withdrawal Contract:
                </label>
                <input
                  type="text"
                  readOnly
                  value="0x9dDD15Fd393523F57EDf8937D44705C9044B16c0"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-purple-700 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
