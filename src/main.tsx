import { Context, Hono } from "https://deno.land/x/hono@v3.10.0/mod.ts";
import {
  deleteCookie,
  getSignedCookie,
  serveStatic,
  setSignedCookie,
} from "https://deno.land/x/hono@v3.10.0/middleware.ts";

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
  userSchema,
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
    <JoinGroup id={0} name="" password="" link="" />
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
app.get("/", (c: Context) => {
  // TODO: check if the "user" cookie is set
  return c.html(
    <Layout style={getStyleTag(sheet)}>
      <Welcome />
    </Layout>,
  );
});

// Mock join (one-time) group page
DEV_ENV && app.get("/otg", (c: Context) =>
  c.html(
      <Layout style={getStyleTag(sheet)}>
        <JoinGroup
          id={0}
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
  return c.html(<JoinGroup {...group} />);
});

app.get("/stats-loader", async (c: Context) => {
  const groupId = c.req.query("otg");
  if (!groupId) return c.body(null, 400);

  // Wait for the user to join the YPT group
  const user = await waitForMember(Number.parseInt(groupId));
  await setSignedCookie(c, "user", JSON.stringify(user), SIGNING_KEY);

  return c.html(<StatsLoader name={user.name} />);
});

app.post("/stats", async (c: Context) => {
  const serializedUser = await getSignedCookie(c, SIGNING_KEY, "user");
  if (!serializedUser) return c.body(null, 400);

  const user = userSchema.parse(JSON.parse(serializedUser));

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
