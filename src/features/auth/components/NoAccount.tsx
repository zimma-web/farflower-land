import React, { useContext, useState } from "react";
import { Context } from "../lib/Provider";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";

export const NoAccount: React.FC = () => {
  const { authService } = useContext(Context);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateLand = async () => {
    setIsProcessing(true);
    try {
      authService.send({
        type: "CREATE_FARM",
      } as any);
    } catch (_) {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-2 flex flex-col space-y-3 items-center text-center">
      <Label type="chill" icon={SUNNYSIDE.icons.heart} className="mb-1">
        Buat Land Baru Farflower
      </Label>
      
      <p className="text-sm px-2 text-brown-900">
        Selamat datang di <b>Farflower Land</b>! Dapatkan lahan pertanian kamu dan mulai menanam, memanen, serta membangun kebun impianmu.
      </p>

      <div className="w-full bg-brown-200 p-2 rounded-md flex flex-col items-center space-y-1">
        <span className="text-xs font-bold text-brown-800">Biaya Pembuatan Land:</span>
        <div className="flex items-center space-x-1">
          <span className="text-base font-bold text-green-700">1.00 USDC</span>
        </div>
      </div>

      <Button
        disabled={isProcessing}
        onClick={handleCreateLand}
        className="w-full mt-2"
      >
        {isProcessing ? "Memproses Pembuatan Land..." : "Bayar 1 USDC & Buat Land"}
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
