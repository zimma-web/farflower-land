import React, { useEffect, useState } from "react";
import { Button } from "components/ui/Button";
import { Panel } from "components/ui/Panel";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
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
  const [message, setMessage] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setIsLoading(true);

    try {
      const res = await window.fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("farflower_admin_auth", data.adminToken || "true");
        setPassError(null);
      } else {
        setPassError(data?.error || "Password Admin Salah!");
      }
    } catch (_) {
      setPassError("Gagal terhubung ke Server Authentication.");
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

  // Password Authentication Guard Screen
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <Panel className="w-full max-w-md p-4 relative bg-[#e2b97c] text-center">
          <div className="flex items-center justify-between border-b-2 border-[#b58951] pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <img src={SUNNYSIDE.icons.lock} className="h-6" />
              <h2 className="text-base font-bold text-brown-900">👑 LOGIN ADMIN FARFLOWER</h2>
            </div>
            <Button onClick={onClose} className="px-2 py-0.5 text-xs">
              X
            </Button>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3">
            <p className="text-xs text-brown-900">
              Silakan masukkan Password Admin untuk mengakses Control Panel & Database:
            </p>

            <input
              type="password"
              placeholder="Masukkan Password Admin..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full p-2 text-sm rounded border border-brown-500 bg-amber-50 text-center font-bold"
              autoFocus
            />

            {passError && <p className="text-xs text-red-600 font-bold">{passError}</p>}

            <Button type="submit" disabled={isLoading} className="w-full py-1.5 text-sm">
              {isLoading ? "Memverifikasi Ke Server..." : "🔑 Masuk Admin Panel"}
            </Button>
          </form>
        </Panel>
      </div>
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
      setMessage(`Land status updated for FID ${player.farcaster_fid}`);
      await loadData();
    }
    setIsLoading(false);
  };

  const handleDeletePlayer = async (player: any) => {
    if (!window.confirm(`Hapus total player FID ${player.farcaster_fid} dari database?`)) {
      return;
    }
    setIsLoading(true);
    const success = await deletePlayerFromSupabase(player.id);
    if (success) {
      setMessage(`Player FID ${player.farcaster_fid} deleted.`);
      await loadData();
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
        setMessage(`State kebun untuk FID ${selectedPlayer.farcaster_fid} berhasil disimpan!`);
        setSelectedFarmState(parsed);
      } else {
        setMessage(`Gagal menyimpan state kebun.`);
      }
    } catch (e) {
      setMessage(`Format JSON tidak valid!`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <Panel className="w-full max-w-3xl max-h-[90vh] flex flex-col p-3 relative bg-[#e2b97c]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#b58951] pb-2 mb-2">
          <div className="flex items-center space-x-2">
            <img src={SUNNYSIDE.icons.settings} className="h-6" />
            <h2 className="text-lg font-bold text-brown-900">👑 FARFLOWER ADMIN CONTROL PANEL</h2>
          </div>
          <Button onClick={onClose} className="px-2 py-0.5 text-xs">
            X
          </Button>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-1 mb-3 overflow-x-auto pb-1">
          <Button
            className={`text-xs py-1 px-3 ${activeTab === "overview" ? "bg-amber-600 text-white" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </Button>
          <Button
            className={`text-xs py-1 px-3 ${activeTab === "players" ? "bg-amber-600 text-white" : ""}`}
            onClick={() => setActiveTab("players")}
          >
            👥 Players ({players.length})
          </Button>
          <Button
            className={`text-xs py-1 px-3 ${activeTab === "farm" ? "bg-amber-600 text-white" : ""}`}
            onClick={() => setActiveTab("farm")}
          >
            🌾 Farm State Editor
          </Button>
          <Button
            className={`text-xs py-1 px-3 ${activeTab === "settings" ? "bg-amber-600 text-white" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Config & Treasury
          </Button>
        </div>

        {message && (
          <div className="bg-amber-100 border border-amber-500 text-amber-900 text-xs p-1.5 rounded mb-2 flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-amber-100/80 border border-amber-600 p-3 rounded text-center">
                <span className="text-xs text-amber-900 font-bold">TOTAL PLAYERS</span>
                <p className="text-2xl font-black text-amber-950 mt-1">{totalPlayers}</p>
              </div>
              <div className="bg-green-100/80 border border-green-600 p-3 rounded text-center">
                <span className="text-xs text-green-900 font-bold">ACTIVE LANDS BOUGHT</span>
                <p className="text-2xl font-black text-green-950 mt-1">{activeLands}</p>
              </div>
              <div className="bg-blue-100/80 border border-blue-600 p-3 rounded text-center">
                <span className="text-xs text-blue-900 font-bold">ESTIMATED REVENUE</span>
                <p className="text-2xl font-black text-blue-950 mt-1">${totalRevenue} USDC</p>
              </div>
            </div>

            <div className="bg-brown-200 p-3 rounded text-xs text-brown-900 space-y-1">
              <p className="font-bold">Status Database Supabase:</p>
              <p>✅ Public Tables: <code className="bg-amber-100 px-1">players</code>, <code className="bg-amber-100 px-1">game_farms</code></p>
              <p>✅ RLS Status: Disabled / Permissive Access Active</p>
              <p>✅ Treasury Address Receiver: <code className="bg-amber-100 px-1">0xe251...90e3</code></p>
            </div>
          </div>
        )}

        {/* TAB 2: PLAYERS MANAGEMENT */}
        {activeTab === "players" && (
          <div className="flex-1 overflow-y-auto space-y-2">
            <div className="flex justify-between items-center mb-1">
              <input
                type="text"
                placeholder="Cari berdasarkan Farcaster FID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs p-1 rounded border border-brown-400 bg-amber-50 w-64"
              />
              <Button onClick={loadData} className="text-xs py-1 px-2">
                🔄 Refresh
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-amber-50 rounded border border-brown-300">
                <thead className="bg-brown-300 text-brown-900">
                  <tr>
                    <th className="p-1.5">Farcaster FID</th>
                    <th className="p-1.5">Status Land</th>
                    <th className="p-1.5">Terdaftar</th>
                    <th className="p-1.5">Aksi Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-200">
                  {filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-2 text-center text-brown-600">
                        Belum ada player terdaftar.
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((p) => (
                      <tr key={p.id} className="hover:bg-amber-100/50">
                        <td className="p-1.5 font-bold">{p.farcaster_fid}</td>
                        <td className="p-1.5">
                          {p.has_land ? (
                            <span className="bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-bold">
                              ✅ Beli (1 USDC)
                            </span>
                          ) : (
                            <span className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded">
                              ❌ Belum Beli
                            </span>
                          )}
                        </td>
                        <td className="p-1.5 text-[10px]">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-1.5 flex space-x-1">
                          <button
                            onClick={() => handleToggleLand(p)}
                            className="bg-amber-700 text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-amber-800"
                          >
                            {p.has_land ? "Revoke Land" : "Grant Land"}
                          </button>
                          <button
                            onClick={() => handleSelectPlayerForFarm(p)}
                            className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-blue-700"
                          >
                            Edit Inventory
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(p)}
                            className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-red-700"
                          >
                            Hapus
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

        {/* TAB 3: FARM STATE EDITOR */}
        {activeTab === "farm" && (
          <div className="flex-1 overflow-y-auto space-y-2">
            {!selectedPlayer ? (
              <div className="p-4 text-center text-brown-800">
                <p className="text-xs">Silakan pilih player di tab <b>👥 Players</b> untuk mengedit isi kebun/inventory mereka.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-amber-100 p-2 rounded flex justify-between items-center text-xs">
                  <span>
                    Mengedit Kebun Player FID: <b>{selectedPlayer.farcaster_fid}</b>
                  </span>
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="text-amber-800 font-bold underline"
                  >
                    Ganti Player
                  </button>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={() => handleInjectItems("coins")} className="text-xs py-1">
                    +1,000 Coins
                  </Button>
                  <Button onClick={() => handleInjectItems("gems")} className="text-xs py-1">
                    +100 Gems
                  </Button>
                  <Button onClick={() => handleInjectItems("flower")} className="text-xs py-1">
                    +500 Farflower
                  </Button>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-brown-900">Farm State JSON:</label>
                  <textarea
                    rows={12}
                    value={jsonString}
                    onChange={(e) => setJsonString(e.target.value)}
                    className="w-full font-mono text-[11px] p-2 bg-black text-green-400 rounded border border-brown-500"
                  />
                </div>

                <Button onClick={handleSaveFarmState} disabled={isLoading} className="w-full py-1.5">
                  {isLoading ? "Menyimpan..." : "💾 Simpan Perubahan State Kebun"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CONFIG & TREASURY */}
        {activeTab === "settings" && (
          <div className="flex-1 overflow-y-auto space-y-3 text-xs text-brown-900">
            <div className="bg-amber-50 p-3 rounded border border-brown-300 space-y-2">
              <h3 className="font-bold text-sm text-brown-900">⚙️ P2E System & Treasury Settings</h3>
              <div>
                <label className="font-bold">Alamat Treasury Penerima Fee 1.00 USDC:</label>
                <input
                  type="text"
                  readOnly
                  value="0xe251A3a0D23859157ef8041394279f7Ba46C90e3"
                  className="w-full p-1 border rounded bg-amber-100 font-mono text-[11px] mt-0.5"
                />
              </div>
              <div>
                <label className="font-bold">Kontrak Token Farflower:</label>
                <input
                  type="text"
                  readOnly
                  value="0xC462c9611871906b8C0152bDa5Ca55E1f439D7e4"
                  className="w-full p-1 border rounded bg-amber-100 font-mono text-[11px] mt-0.5"
                />
              </div>
              <div>
                <label className="font-bold">Kontrak Penarikan (Withdrawal):</label>
                <input
                  type="text"
                  readOnly
                  value="0x9dDD15Fd393523F57EDf8937D44705C9044B16c0"
                  className="w-full p-1 border rounded bg-amber-100 font-mono text-[11px] mt-0.5"
                />
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};
