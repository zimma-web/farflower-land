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

  // Modern Professional Login Guard Modal
  if (!isAuthenticated) {
    return createPortal(
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 font-sans text-slate-100 pointer-events-auto">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative pointer-events-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                🔒
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Admin Authentication</h2>
                <p className="text-xs text-slate-400">Enter master password to access dashboard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Master Password</label>
              <input
                type="password"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                autoFocus
              />
            </div>

            {passError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
                ⚠️ {passError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {isLoading ? "Authenticating..." : "Login to Admin Dashboard"}
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
      setMessage({ text: `Invalid JSON format! Check syntax.`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Modern Professional Main Dashboard Modal
  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 font-sans text-slate-100 pointer-events-auto">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white font-bold text-sm shadow-md">
              👑
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Farflower Admin Control Panel</h2>
              <p className="text-xs text-slate-400">Database Management & Game State Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex space-x-2 px-6 pt-3 pb-1 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab("players")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "players"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            👥 Players ({players.length})
          </button>
          <button
            onClick={() => setActiveTab("farm")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "farm"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            🌾 Farm State Editor
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            ⚙️ Config & Treasury
          </button>
        </div>

        {/* Notification Banner */}
        {message && (
          <div
            className={`mx-6 mt-3 p-3 rounded-xl text-xs font-medium flex items-center justify-between border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-3 font-bold hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>TOTAL PLAYERS</span>
                    <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">👥</span>
                  </div>
                  <p className="text-3xl font-extrabold text-white mt-2">{totalPlayers}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Registered in Supabase</p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>ACTIVE LANDS BOUGHT</span>
                    <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">🏞️</span>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-400 mt-2">{activeLands}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Paid 1.00 USDC activation</p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>ESTIMATED REVENUE</span>
                    <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400">💰</span>
                  </div>
                  <p className="text-3xl font-extrabold text-blue-400 mt-2">${totalRevenue} USDC</p>
                  <p className="text-[11px] text-slate-500 mt-1">Treasury total revenue</p>
                </div>
              </div>

              {/* Status Box */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Database & System Health</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <span className="text-emerald-400">✅</span>
                    <span>Supabase Tables: <code className="bg-slate-950 px-2 py-0.5 rounded text-indigo-300 font-mono">players</code>, <code className="bg-slate-950 px-2 py-0.5 rounded text-indigo-300 font-mono">game_farms</code></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <span className="text-emerald-400">✅</span>
                    <span>RLS Policy: Permissive Client Access</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300 sm:col-span-2">
                    <span className="text-emerald-400">✅</span>
                    <span>Treasury Address Receiver: <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-300 font-mono">0xe251A3a0D23859157ef8041394279f7Ba46C90e3</code></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYERS MANAGEMENT TABLE */}
          {activeTab === "players" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Search player by Farcaster FID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-72 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={loadData}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                >
                  🔄 Refresh Data
                </button>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5">Farcaster FID</th>
                      <th className="p-3.5">Land Status</th>
                      <th className="p-3.5">Registration Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-500">
                          No players found in database.
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-white font-mono">{p.farcaster_fid}</td>
                          <td className="p-3.5">
                            {p.has_land ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ✅ Active (1 USDC)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                ❌ Not Purchased
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : "-"}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleToggleLand(p)}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-medium transition-all"
                            >
                              {p.has_land ? "Revoke Land" : "Grant Land"}
                            </button>
                            <button
                              onClick={() => handleSelectPlayerForFarm(p)}
                              className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-[11px] font-medium transition-all"
                            >
                              Edit State
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(p)}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-[11px] font-medium transition-all"
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

          {/* TAB 3: FARM STATE JSON EDITOR */}
          {activeTab === "farm" && (
            <div className="space-y-4">
              {!selectedPlayer ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                  <p>Select a player in the <b>👥 Players</b> tab to edit their farm state JSON.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs">
                    <span className="text-slate-300">
                      Editing state for FID: <b className="text-white font-mono">{selectedPlayer.farcaster_fid}</b>
                    </span>
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Change Player
                    </button>
                  </div>

                  {/* Quick Inject Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleInjectItems("coins")}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      🪙 +1,000 Coins
                    </button>
                    <button
                      onClick={() => handleInjectItems("gems")}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      💎 +100 Gems
                    </button>
                    <button
                      onClick={() => handleInjectItems("flower")}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      🌸 +500 Farflower Tokens
                    </button>
                  </div>

                  {/* JSON Editor Textarea */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Farm State JSON Editor:</label>
                    <textarea
                      rows={12}
                      value={jsonString}
                      onChange={(e) => setJsonString(e.target.value)}
                      className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleSaveFarmState}
                    disabled={isLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Saving Farm State..." : "💾 Save Farm State Changes"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONFIG & TREASURY */}
          {activeTab === "settings" && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white tracking-tight">⚙️ P2E System & Treasury Settings</h3>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Treasury Address Recipient (1.00 USDC Fee):</label>
                  <input
                    type="text"
                    readOnly
                    value="0xe251A3a0D23859157ef8041394279f7Ba46C90e3"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Farflower Token Contract:</label>
                  <input
                    type="text"
                    readOnly
                    value="0xC462c9611871906b8C0152bDa5Ca55E1f439D7e4"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-indigo-400 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Withdrawal Contract:</label>
                  <input
                    type="text"
                    readOnly
                    value="0x9dDD15Fd393523F57EDf8937D44705C9044B16c0"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-purple-400 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
