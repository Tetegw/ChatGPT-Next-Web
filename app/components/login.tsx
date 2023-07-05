import styles from "./login.module.scss";
import { IconButton } from "./button";
import { showToast } from "./ui-lib";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useState } from "react";
import Locale from "../locales";

import BotIcon from "../icons/bot.svg";

export function Login() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const Login = {
    Account: "请输入账号",
    Password: "请输入密码",
    Confirm: "登 录",
  };

  const login = async () => {
    console.log("account", account, password);
    const res = await fetch(
      "https://azure-api.shcklm.com:9040/gpt-admin-api/biz/gptUser/login",
      {
        body: JSON.stringify({
          userAcct: account,
          password: password,
        }),
        headers: {
          "Content-Type": "application/json",
          "Content-Security-Policy": "upgrade-insecure-requests",
        },
        method: "POST",
      },
    );
    let resJson = await res.json();
    if (resJson.code == 200) {
      console.log("resJson", resJson);
      window.localStorage.setItem("token", resJson.token);
      window.localStorage.setItem("userId", resJson.userId);
      showToast("登录成功");
      navigate(Path.Chat);
    } else {
      showToast(resJson.msg);
    }
  };

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon />
      </div>

      {/* <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div> */}

      <div>
        <span>账号：</span>
        <input
          className={styles["auth-input"]}
          type="text"
          placeholder={Login.Account}
          value={account}
          onChange={(e) => {
            setAccount(e.currentTarget.value);
          }}
        />
      </div>
      <div>
        <span>密码：</span>
        <input
          className={styles["auth-input"]}
          type="password"
          placeholder={Login.Password}
          value={password}
          onChange={(e) => {
            setPassword(e.currentTarget.value);
          }}
        />
      </div>

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Login.Confirm}
          type="primary"
          onClick={() => {
            login();
          }}
        />
        {/* <IconButton text={Locale.Auth.Later} onClick={goHome} /> */}
      </div>
    </div>
  );
}
