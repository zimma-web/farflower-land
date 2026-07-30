import React, { useContext, useEffect } from "react";
import { useActor } from "@xstate/react";

import { CONFIG } from "lib/config";

import { Context } from "../lib/Provider";
import { wallet } from "lib/blockchain/wallet";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Loading } from "./Loading";

export const Verifying: React.FC = () => {
  const { authService } = useContext(Context);
  const [authState] = useActor(authService);

  const { t } = useAppTranslation();

  useEffect(() => {
    authService.send("VERIFIED", {
      data: {
        account:
          wallet.getConnection() || authState.context.user.token?.address,
        token: authState.context.user.rawToken,
      },
    });
  }, []);

  return <Loading />;
};
