const express = require("express");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCOPES = "user.identity";

const loginUrl = new URL("https://start.gg/oauth/authorize");
loginUrl.searchParams.append("client_id", CLIENT_ID);
loginUrl.searchParams.append("redirect_uri", `${BASE_URL}/callback`);
loginUrl.searchParams.append("response_type", "code");
loginUrl.searchParams.append("scope", SCOPES);

const tokenUrl = new URL("https://api.start.gg/oauth/access_token");

const app = express();
const port = 3000;

app.use(express.static("../frontend"));

app.get("/login", (req, res) => {
  return res.redirect(loginUrl.toString());
});

app.get("/callback", async (req, res) => {
  let code = req.query.code;
  if (!code) {
    return res.json({ "error": "No code provided" });
  }

  tokenUrl.searchParams.append("code", code);

  let body = {
    "grant_type": "authorization_code",
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "scope": SCOPES,
    "redirect_uri": `${BASE_URL}/callback`,
    "code": code,
  };

  let response = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status !== 200) {
    console.error(response.body);
    return res.json({ "error": "Failed to get token" });
  }

  let token = await response.json();
  return res.redirect("/index.html?access_token=" + token.access_token);
});

app.listen(port, () => {
  console.log("Server is running on port 3000");
});
