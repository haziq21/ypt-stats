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
import StatsCard from "./components/StatsCard.tsx";
import SummaryStats from "./components/SummaryStats.tsx";

import {
  createOneTimeGroup,
  deleteAllGroups,
  getStudyStats,
  User,
  waitForMember,
} from "./ypt.ts";

// Environment variables
const JWT_SECRET = Deno.env.get("SIGNING_KEY")!;
const DEV_ENV = Deno.env.get("ENVIRONMENT") === "DEV";

// Twind setup
const sheet = virtualSheet();
setup({
  sheet,
  theme: {
    extend: { colors },
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
  <StatsCard name="" />
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
  const user: User = await verify(userJwt, JWT_SECRET);

  return c.html(
    <Layout style={getStyleTag(sheet)}>
      <StatsCard name={user.name} />
    </Layout>,
  );
});

// Mock join (one-time) group page
DEV_ENV && app.get("/otg", (c: Context) =>
  c.html(
    <Layout style={getStyleTag(sheet)}>
      <JoinGroup
        otg=""
        name="ypt stats [21]"
        password="1234"
        link="https://invite.yeolpumta.com/13cF"
      />
    </Layout>,
  ));

// Join temporary YPT group
app.post("/otg", async (c: Context) => {
  // Create a one-time YPT group to identify and authenticate the user
  const group = await createOneTimeGroup();
  const otgJwt = await sign({ otg: group.id }, JWT_SECRET);

  return c.html(<JoinGroup {...group} otg={otgJwt} />);
});

// Mock stats card
DEV_ENV && app.get("/stats-card", async (c: Context) => {
  const user = { name: "haziq21", id: 7271448 };
  const userJwt = await sign(user, JWT_SECRET);
  setCookie(c, "user", userJwt);

  return c.html(
    <Layout style={getStyleTag(sheet)}>
      <StatsCard name={user.name} />
    </Layout>,
  );
});

app.post("/stats-card", async (c: Context) => {
  const otgJwt = c.req.query("otg");

  // Verify that the otg JWT is present and valid
  if (!otgJwt) return c.body(null, 400);
  const otg: number = (await verify(otgJwt, JWT_SECRET)).otg;

  // Wait for the user to join the YPT group
  const user = await waitForMember(otg);

  // JWT cookie to authenticate user on /stats route and allow for
  // recurrent logins without redoing the one-time group thing
  setCookie(c, "user", await sign(user, JWT_SECRET));

  return c.html(<StatsCard name={user.name} />);
});

app.post("/stats", async (c: Context) => {
  const userJwt = getCookie(c, "user");

  // Verify that the user JWT is present and valid
  if (!userJwt) return c.body(null, 401);
  const user: User = await verify(userJwt, JWT_SECRET);

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
