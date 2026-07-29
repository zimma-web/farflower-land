import React from "react";
import { Button } from "components/ui/Button";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { useContext, useState } from "react";
import {
  type Connector,
  type CreateConnectorFn,
  useConnect,
  useConnection,
  useConnections,
  useDisconnect,
} from "wagmi";
import type { ConnectErrorType } from "wagmi/actions";
import { FarcasterButton } from "./buttons/FarcasterButton";
import { SUNNYSIDE } from "assets/sunnyside";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { Context as AuthContext } from "features/auth/lib/Provider";
import { Loading } from "features/auth/components";
import { SignMessage } from "./SignMessage";

const CONTENT_HEIGHT = 365;

const ConnectingToWallet: React.FC<{ disconnect: () => void }> = ({
  disconnect,
}) => {
  const { t } = useAppTranslation();

  return (
    <div>
      <div className="px-2 mb-3 mt-1">
        <p className="text-sm">{t("walletWall.pleaseAcceptConnection")}</p>
      </div>
      <Button onClick={disconnect}>{t("walletWall.tryAnotherWallet")}</Button>
    </div>
  );
};

const ConnectErrorMessage: React.FC<{
  error: ConnectErrorType;
}> = ({ error }) => {
  const { t } = useAppTranslation();

  switch (error.name) {
    case "ConnectorAlreadyConnectedError":
      return (
        <div className="px-2 mt-2 mb-3">
          {t("walletWall.connectError.alreadyConnected")}
        </div>
      );
    case "UserRejectedRequestError":
      return (
        <div className="px-2 mt-2 mb-3">
          {t("walletWall.connectError.userRejectedRequest")}
        </div>
      );
    case "ResourceUnavailableRpcError":
      return (
        <div className="px-2 mt-2 mb-3">
          {t("walletWall.connectError.resourceUnavailable")}
        </div>
      );
    case "WagmiCoreError":
      return <div className="px-2 mt-2 mb-3">{error.message}</div>;
    default:
      return <div className="px-2 mt-2 mb-3">{error.message}</div>;
  }
};

const ConnectError: React.FC<{
  error: ConnectErrorType;
  disconnect: () => void;
}> = ({ error, disconnect }) => {
  const { t } = useAppTranslation();

  return (
    <div>
      <ConnectErrorMessage error={error} />
      <div>
        <Button onClick={() => disconnect()}>
          {t("walletWall.tryAnotherWallet")}
        </Button>
      </div>
    </div>
  );
};

const BackHeader: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  const { t } = useAppTranslation();

  return (
    <div className="flex items-center mb-2 cursor-pointer " onClick={onClick}>
      <img
        src={SUNNYSIDE.icons.arrow_left}
        className="mr-2"
        style={{
          width: `${PIXEL_SCALE * 8}px`,
        }}
      />
      <span className="text-sm">{t("back")}</span>
    </div>
  );
};

export const WalletWall: React.FC<{
  header?: React.ReactNode;
  screen?: "signin" | "signup" | "walletWall";
  onSignMessage:
    | (({ address, signature }: { address: string; signature: string }) => void)
    | null;
}> = ({ header, screen = "walletWall", onSignMessage }) => {
  const { authService } = useContext(AuthContext);
  const { t } = useAppTranslation();

  const [showLoading, setShowLoading] = useState(false);
  const [hasClickedWallet, setHasClickedWallet] = useState(false);

  const { isConnecting, isConnected } = useConnection();
  const { mutateAsync: asyncConnect, reset, error, isError } = useConnect();
  const { mutateAsync: asyncDisconnect } = useDisconnect();
  const connections = useConnections();

  const isLoginScreen = screen === "signin" || screen === "signup";

  const onConnect = async (connector: Connector | CreateConnectorFn) => {
    setHasClickedWallet(true);
    await onDisconnect();
    await asyncConnect({ connector });
  };

  const onDisconnect = async () => {
    await asyncDisconnect();
    for (const connection of connections) {
      await asyncDisconnect({ connector: connection.connector });
    }
  };

  if (showLoading) {
    return <Loading />;
  }

  if (isConnecting) {
    return <ConnectingToWallet disconnect={onDisconnect} />;
  }

  if (isError) {
    return <ConnectError error={error} disconnect={reset} />;
  }

  if (isConnected && onSignMessage && (!isLoginScreen || hasClickedWallet)) {
    return (
      <SignMessage onSignMessage={onSignMessage} onDisconnect={onDisconnect} />
    );
  }

  return (
    <div
      className="overflow-y-auto scrollable pt-1"
      style={{ maxHeight: CONTENT_HEIGHT }}
    >
      {header}
      {isLoginScreen && (
        <BackHeader onClick={() => authService.send("BACK")} />
      )}
      <FarcasterButton onConnect={onConnect} />
    </div>
  );
};
