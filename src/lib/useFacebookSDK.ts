"use client";

import { useEffect, useState } from "react";

const FB_APP_ID = "1010904391689357";
const FB_VERSION = "v19.0";

declare global {
  interface Window {
    FB: {
      init: (opts: object) => void;
      login: (cb: (res: { authResponse?: { accessToken: string } }) => void, opts: object) => void;
      logout: (cb: () => void) => void;
      getLoginStatus: (cb: (res: { status: string; authResponse?: { accessToken: string } }) => void) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export type FBStatus = "idle" | "loading" | "connected" | "error";

export function useFacebookSDK() {
  const [status, setStatus] = useState<FBStatus>("loading");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Carga el SDK solo una vez
    if (document.getElementById("facebook-jssdk")) {
      setStatus("idle");
      return;
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: FB_VERSION,
      });

      window.FB.getLoginStatus((res) => {
        if (res.status === "connected" && res.authResponse?.accessToken) {
          setToken(res.authResponse.accessToken);
          setStatus("connected");
        } else {
          setStatus("idle");
        }
      });
    };

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/es_LA/sdk.js";
    js.async = true;
    js.defer = true;
    document.body.appendChild(js);
  }, []);

  const login = () => {
    if (!window.FB) return;
    setStatus("loading");
    window.FB.login(
      (res) => {
        if (res.authResponse?.accessToken) {
          setToken(res.authResponse.accessToken);
          setStatus("connected");
        } else {
          setStatus("idle");
        }
      },
      { scope: "ads_read,ads_management" }
    );
  };

  const logout = () => {
    if (!window.FB) return;
    window.FB.logout(() => {
      setToken(null);
      setStatus("idle");
    });
  };

  return { status, token, login, logout };
}
