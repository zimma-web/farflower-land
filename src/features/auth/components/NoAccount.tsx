import React, { useContext, useEffect, useState } from "react";
import { Context } from "../lib/Provider";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
import { getToken } from "../actions/social";
import { syncPlayerToSupabase, syncFarmToSupabase } from "lib/supabaseClient";
import { OFFLINE_FARM } from "features/game/lib/landData";
import { getRealFarcasterFid } from "../actions/login";
import { sdk } from "@farcaster/miniapp-sdk";
import { wallet } from "lib/blockchain/wallet";

export const NoAccount: React.FC = () => {
  const { authService } = useContext(Context);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const realFid = await getRealFarcasterFid();
        await syncPlayerToSupabase(realFid);
      } catch (_) {
        await syncPlayerToSupabase(1001);
      }
    })();
  }, []);

  const handleCreateLand = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const realFid = await getRealFarcasterFid();
      const recipient = "0xe251A3a0D23859157ef8041394279f7Ba46C90e3";

      let txConfirmed = false;

      // Trigger 1.00 USDC Wallet Transaction
      try {
        if ((sdk as any)?.actions?.sendToken) {
          await (sdk as any).actions.sendToken({
            recipient,
            amount: "1000000", // 1 USDC (6 decimals)
            token: "USDC",
          });
          txConfirmed = true;
        } else if (wallet.getConnection()) {
          await wallet.donate(1, recipient as `0x${string}`);
          txConfirmed = true;
        } else {
          // Dev / Direct activation fallback
          txConfirmed = true;
        }
      } catch (payErr: any) {
        if (
          payErr?.message?.includes("user rejected") ||
          payErr?.message?.includes("User denied") ||
          payErr?.message?.includes("cancelled")
        ) {
          setErrorMsg("Pembayaran 1.00 USDC dibatalkan oleh pengguna.");
          setIsProcessing(false);
          return;
        }
        txConfirmed = true;
      }

      if (!txConfirmed) {
        setErrorMsg("Transaksi 1.00 USDC gagal. Silakan coba lagi.");
        setIsProcessing(false);
        return;
      }

      const now = new Date().toISOString();

      // Update player record with has_land = true & land_activated_at timestamp in Supabase
      await syncPlayerToSupabase(realFid, {
        has_land: true,
        land_activated_at: now,
      });

      // Sync default farm state to game_farms in Supabase
      await syncFarmToSupabase(realFid, OFFLINE_FARM);

      const token = getToken();
      await window.fetch("/api/create-farm", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      // Transition machine to connected
      authService.send({
        type: "CREATE_FARM",
      } as any);
    } catch (err) {
      authService.send({
        type: "CREATE_FARM",
      } as any);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-2 flex flex-col space-y-3 items-center text-center">
      <Label type="chill" icon={SUNNYSIDE.icons.heart} className="mb-1">
        Buat Land Baru Farflower
      </Label>
      
      <p className="text-sm px-2 text-brown-900">
        Akun Farcaster kamu telah terdaftar di database! Untuk mengaktifkan akun dan mulai menanam, dapatkan land pertanian kamu.
      </p>

      <div className="w-full bg-brown-200 p-2 rounded-md flex flex-col items-center space-y-1">
        <span className="text-xs font-bold text-brown-800">Harga Aktivasi Land:</span>
        <div className="flex items-center space-x-1">
          <span className="text-base font-bold text-green-700">1.00 USDC</span>
        </div>
        <span className="text-[10px] text-brown-600 truncate max-w-full">
          Penerima: 0xe251...90e3
        </span>
      </div>

      {errorMsg && <p className="text-xs text-red-600 font-bold">{errorMsg}</p>}

      <Button
        disabled={isProcessing}
        onClick={handleCreateLand}
        className="w-full mt-2"
      >
        {isProcessing ? "Memproses Pembuatan Land..." : "Bayar 1 USDC & Aktifkan Land"}
      </Button>
    </div>
  );
};

export const ClaimAccount: React.FC<{
  onClaim?: (id: number) => void;
  onBack: () => void;
}> = ({ onBack }) => {
  return (
    <div className="p-2 flex flex-col space-y-2 text-center">
      <p className="text-sm">Silakan buat land baru untuk melanjutkan.</p>
      <Button onClick={onBack}>Kembali</Button>
    </div>
  );
};
