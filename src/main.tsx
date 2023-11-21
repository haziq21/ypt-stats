import { Context, Hono } from "hono/mod.ts";
import {
  deleteCookie,
  getCookie,
  serveStatic,
  setCookie,
} from "hono/middleware.ts";
import { sign, verify } from "hono/middleware/jwt/index.ts";

import { setup } from "npm:twind";
import { getStyleTag, virtualSheet } from "npm:twind/sheets";
import * as colors from "npm:twind/colors";

import Layout from "./components/Layout.tsx";
import Welcome from "./components/Welcome.tsx";
import JoinGroup from "./components/JoinGroup.tsx";
import StatsLoader from "./components/StatsLoader.tsx";
import SummaryStats from "./components/SummaryStats.tsx";

import {
  createOneTimeGroup,
  deleteAllGroups,
  getStudyStats,
  User,
  waitForMember,
} from "./ypt.ts";

const SIGNING_KEY = Deno.env.get("SIGNING_KEY")!;
const DEV_ENV = Deno.env.get("ENVIRONMENT") === "DEV";

// Twind setup
const sheet = virtualSheet();
setup({
  sheet,
  theme: {
    extend: {
      colors,
    },
  },
  plugins: {
    "focus-ring":
      "focus:outline-none focus-visible:ring(& warmGray-200 offset(2 warmGray-900))",
  },
});

// Evaluate all the components so Twind generates the classes
(<>
  <Layout style="">
    <Welcome />
  </Layout>
  <JoinGroup otg="" name="" password="" link="" />
  <StatsLoader name="" />
  <SummaryStats
    totalStudyTime={0}
    totalAllowedAppTime={0}
    longestStreak={0}
    subjectTimings={{}}
  />
</>).toString();

// Initialise Hono
const app = new Hono();

// Static assets
app.use("/assets/*", serveStatic({ root: "./src" }));

// Homepage
app.get("/", async (c: Context) => {
  // TODO: check if the "user" cookie is set
  const userJwt = getCookie(c, "user");

  // User hasn't logged in before
  if (!userJwt) {
    return c.html(
      <Layout style={getStyleTag(sheet)}>
        <Welcome />
      </Layout>,
    );
  }

  // User has logged in before so get their username
  const user: User = await verify(userJwt, SIGNING_KEY);
  return c.html(
    <Layout style={getStyleTag(sheet)}>
      <StatsLoader name={user.name} />
    </Layout>,
  );
});

// Mock join (one-time) group page
DEV_ENV && app.get("/otg", (c: Context) =>
  c.html(
    <Layout style={getStyleTag(sheet)}>
      <JoinGroup
        otg=""
        name="ypt stats"
        password="1234"
        link="https://invite.yeolpumta.com/13cF"
      />
    </Layout>,
  ));

// Join temporary YPT group
app.post("/otg", async (c: Context) => {
  // Create a one-time YPT group to identify and authenticate the user
  const group = await createOneTimeGroup();
  const otgJwt = await sign({ otg: group.id }, SIGNING_KEY);

  return c.html(<JoinGroup {...group} otg={otgJwt} />);
});

// Mock stats loader
DEV_ENV && app.get("/stats-loader", async (c: Context) => {
  setCookie(
    c,
    "user",
    await sign({ name: "haziq21", id: 7271448 }, SIGNING_KEY),
  );

  return c.html(
    <Layout style={getStyleTag(sheet)}>
      <StatsLoader name="haziq21" />
    </Layout>,
  );
});

app.post("/stats-loader", async (c: Context) => {
  const otgJwt = c.req.query("otg");

  // Verify that the otg JWT is present and valid
  if (!otgJwt) return c.body(null, 400);
  const otg: number = (await verify(otgJwt, SIGNING_KEY)).otg;

  // Wait for the user to join the YPT group
  const user = await waitForMember(otg);

  // JWT cookie to authenticate user on /stats route and allow for recurrent
  // logins without redoing the one-time group account identification
  setCookie(c, "user", await sign(user, SIGNING_KEY));

  return c.html(<StatsLoader name={user.name} />);
});

app.post("/stats", async (c: Context) => {
  const userJwt = getCookie(c, "user");

  // Verify that the user JWT is present and valid
  if (!userJwt) return c.body(null, 401);
  const user: User = await verify(userJwt, SIGNING_KEY);

  // Generate the stats
  const stats = await getStudyStats(user.id);

  return c.html(<SummaryStats {...stats} />);
});

// Delete all the bot-created groups
DEV_ENV && app.delete("/groups", async (c: Context) => {
  const count = await deleteAllGroups();
  return c.text(`Deleted ${count} groups`);
});

Deno.serve(app.fetch);
