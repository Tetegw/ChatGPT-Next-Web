import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_API_HOST, StoreKey } from "../constant";
import { getHeaders } from "../client/api";
import { BOT_HELLO } from "./chat";
import { ALL_MODELS } from "./config";
import { getClientConfig } from "../config/client";

export interface AccessControlStore {
  accessCode: string;
  token: string;

  needCode: boolean;
  hideUserApiKey: boolean;
  openaiUrl: string;

  gpt16kNumsRemaining: string;
  gpt4kNumsRemaining: string;

  updateToken: (_: string) => void;
  updateCode: (_: string) => void;
  updateOpenAiUrl: (_: string) => void;
  enabledAccessControl: () => boolean;
  getUserUseNum: (_: any) => void;
  reduceNum: (_: any) => void;
  isAuthorized: () => boolean;
  fetch: () => void;
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const DEFAULT_OPENAI_URL =
  getClientConfig()?.buildMode === "export" ? DEFAULT_API_HOST : "/api/openai/";
console.log("[API] default openai url", DEFAULT_OPENAI_URL);

export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      token: "",
      accessCode: "chat1223",
      needCode: true,
      hideUserApiKey: false,
      openaiUrl: DEFAULT_OPENAI_URL,
      gpt16kNumsRemaining: "",
      gpt4kNumsRemaining: "",

      enabledAccessControl() {
        get().fetch();

        return get().needCode;
      },
      updateCode(code: string) {
        set(() => ({ accessCode: code }));
      },
      updateToken(token: string) {
        set(() => ({ token }));
      },
      updateOpenAiUrl(url: string) {
        set(() => ({ openaiUrl: url }));
      },

      getUserUseNum(callback: any) {
        fetch(
          "https://azure-api.shcklm.com:9040/gpt-admin-api/biz/gptUser/selectNum",
          {
            body: JSON.stringify({
              userId: window.localStorage.getItem("userId"),
              token: window.localStorage.getItem("token"),
            }),
            headers: {
              "Content-Type": "application/json",
              "Content-Security-Policy": "upgrade-insecure-requests",
            },
            method: "POST",
          },
        ).then(async (res) => {
          let resJson = await res.json();
          console.log("resJson", resJson);
          if (resJson.code == 200) {
            set(() => ({
              gpt4NumsRemaining: resJson.gpt4NumsRemaining,
              gpt16kNumsRemaining: resJson.gpt16kNumsRemaining,
            }));
          } else {
            callback && callback(resJson);
          }
        });
      },

      reduceNum(params: any) {
        fetch(
          "https://azure-api.shcklm.com:9040/gpt-admin-api/biz/gptUser/optNum",
          {
            body: JSON.stringify({
              userId: window.localStorage.getItem("userId"),
              token: window.localStorage.getItem("token"),
              gptVer: params.gptVer,
            }),
            headers: {
              "Content-Type": "application/json",
              "Content-Security-Policy": "upgrade-insecure-requests",
            },
            method: "POST",
          },
        ).then(async (res) => {
          let resJson = await res.json();
          console.log("resJson", resJson);
          if (resJson.code == 200) {
            set(() => ({
              gpt4NumsRemaining: resJson.gpt4NumsRemaining,
              gpt16kNumsRemaining: resJson.gpt16kNumsRemaining,
            }));
          } else {
            params.callback && params.callback(resJson);
          }
        });
      },

      isAuthorized() {
        get().fetch();

        // has token or has code or disabled access control
        return (
          !!get().token || !!get().accessCode || !get().enabledAccessControl()
        );
      },
      fetch() {
        if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
        fetchState = 1;
        fetch("/api/config", {
          method: "post",
          body: null,
          headers: {
            ...getHeaders(),
          },
        })
          .then((res) => res.json())
          .then((res: DangerConfig) => {
            console.log("[Config] got config from server", res);
            set(() => ({ ...res }));

            if (!res.enableGPT4) {
              ALL_MODELS.forEach((model) => {
                if (model.name.startsWith("gpt-4")) {
                  (model as any).available = false;
                }
              });
            }

            if ((res as any).botHello) {
              BOT_HELLO.content = (res as any).botHello;
            }
          })
          .catch(() => {
            console.error("[Config] failed to fetch config");
          })
          .finally(() => {
            fetchState = 2;
          });
      },
    }),
    {
      name: StoreKey.Access,
      version: 1,
    },
  ),
);
