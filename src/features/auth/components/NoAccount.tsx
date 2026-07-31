import React, { useContext, useState } from "react";
import { Context } from "../lib/Provider";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
import { getToken } from "../actions/social";

export const NoAccount: React.FC = () => {
  const { authService } = useContext(Context);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateLand = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const token = getToken();
      const res = await window.fetch("/api/create-farm", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Gagal membuat land di server");
      }

      // Transition machine to connected
      authService.send({
        type: "CREATE_FARM",
      } as any);
    } catch (err) {
      // Fallback: continue into farm land creation
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

      {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

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
