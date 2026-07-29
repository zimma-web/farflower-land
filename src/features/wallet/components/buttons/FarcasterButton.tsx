import { Button } from "components/ui/Button";
import { FARCASTER_ICON } from "features/wallet/lib/getWalletIcon";
import { farcasterConnector } from "features/wallet/WalletProvider";
import React from "react";
import { type Connector, type CreateConnectorFn, useConnectors } from "wagmi";

export const FarcasterButton: React.FC<{
  onConnect: (connector: Connector | CreateConnectorFn) => void;
}> = ({ onConnect }) => {

  return (
    <Button
      className="mb-1 py-2 text-sm relative"
      onClick={() => onConnect(farcasterConnector)}
    >
      <div className="px-8">
        <img
          src={FARCASTER_ICON}
          className="h-7 ml-2.5 mr-6 absolute left-0 top-1"
        />
        {"Farcaster (Wallet)"}
      </div>
    </Button>
  );
};
