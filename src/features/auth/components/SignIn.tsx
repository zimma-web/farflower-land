import React, { useContext } from "react";

import { Context as AuthContext } from "../lib/Provider";

import { useAppTranslation } from "lib/i18n/useAppTranslations";

import { WalletWall } from "features/wallet/components/WalletWall";

const Login: React.FC<{ screen: "signin" | "signup" }> = ({ screen }) => {
  const { authService } = useContext(AuthContext);
  const { t } = useAppTranslation();

  return (
    <>
      <WalletWall
        screen={screen}
        onSignMessage={({ address, signature }) => {
          authService.send("CONNECTED", { address, signature });
        }}
      />
    </>
  );
};

export const SignIn = () => <Login screen="signin" />;
export const SignUp = () => <Login screen="signup" />;
