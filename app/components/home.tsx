"use client";

require("../polyfill");

import { useState, useEffect } from "react";

import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import { getLang } from "../locales";
import { IconButton } from "./button";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { Login } from "./login";
import { getClientConfig } from "../config/client";
import { api } from "../client/api";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=Noto+Sans+SC:wght@300;400;700;900&display=swap";
  document.head.appendChild(linkEl);
};

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isLogin = location.pathname === Path.Login;
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    loadAsyncGoogleFont();

    if (window.localStorage.getItem("version") != "2023070601") {
      setShowUpdate(true);
    }
    // 判断登录，没登录就跳转到登录页面
    if (!isLogin) {
      if (
        !window.localStorage.getItem("token") ||
        !window.localStorage.getItem("userId")
      ) {
        navigate(Path.Login);
      }
    }
  }, []);

  return (
    <div
      className={
        styles.container +
        ` ${
          config.tightBorder && !isMobileScreen
            ? styles["tight-container"]
            : styles.container
        } ${getLang() === "ar" ? styles["rtl-screen"] : ""}`
      }
    >
      {isLogin ? (
        <>
          <Login />
        </>
      ) : isAuth ? (
        <>
          <AuthPage />
        </>
      ) : (
        <>
          <SideBar className={isHome ? styles["sidebar-show"] : ""} />

          <div className={styles["window-content"]} id={SlotID.AppBody}>
            <Routes>
              <Route path={Path.Home} element={<Chat />} />
              <Route path={Path.NewChat} element={<NewChat />} />
              <Route path={Path.Masks} element={<MaskPage />} />
              <Route path={Path.Chat} element={<Chat />} />
              <Route path={Path.Settings} element={<Settings />} />
            </Routes>
          </div>
        </>
      )}
      {showUpdate && (
        <>
          <div className={styles["update-mask"]}>
            <div className={styles["update-text"]}>
              <div className={styles["title"]}>更新说明</div>
              <div className={styles["list"]}>
                <br></br>1、 新增用户登录。
                <br></br>2、 去除授权码验证。
                <br></br>3、 新增16K模型使用次数限制。
                <br></br>4、 新增gpt-4模型。
                <br></br>5、
                进行了一些UI布局的优化，修复了部分场景下布局错乱的问题。
              </div>
              <div className={styles["sub-title"]}>
                提示：更新版本后如果出现异常情况，请至设置页【清除数据】后尝试
              </div>
              <div className={styles["button"]}>
                <IconButton
                  text="确定"
                  type="primary"
                  onClick={() => {
                    setShowUpdate(false);
                    window.localStorage.setItem("version", "2023070601");
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function useLoadData() {
  // const config = useAppConfig();
  // useEffect(() => {
  //   (async () => {
  //     const models = await api.llm.models();
  //     config.mergeModels(models);
  //   })();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
