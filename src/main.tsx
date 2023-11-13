import { Context, Hono } from "npm:hono";
import {
  deleteCookie,
  getSignedCookie,
  setSignedCookie,
} from "npm:hono/cookie";

import { setup, tw } from "npm:twind";
import { getStyleTag, virtualSheet } from "npm:twind/sheets";

import "https://deno.land/std@0.206.0/dotenv/load.ts";

import Main from "./components/Main.tsx";
import JoinGroup from "./components/JoinGroup.tsx";
import StatsLoader from "./components/StatsLoader.tsx";
import SummaryStats from "./components/SummaryStats.tsx";

// import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

import {
  createOneTimeGroup,
  deleteAllGroups,
  getStudyStats,
  userSchema,
  waitForMember,
} from "./ypt.ts";

const PRIVATE_KEY = Deno.env.get("PRIVATE_KEY")!;

const app = new Hono();

// Homepage
app.get("/", (c: Context) => {
  // TODO: check if the "user" cookie is set
  return c.html(<Main />);
});

app.post("/otg", async (c: Context) => {
  // Create a one-time YPT group to identify and authenticate the user
  const group = await createOneTimeGroup();
  // So we can identify the user on the /stats endpoint
  await setSignedCookie(c, "otg", group.id.toString(), PRIVATE_KEY);

  return c.html(<JoinGroup {...group} />);
});

app.get("/stats-loader", async (c: Context) => {
  const groupId = await getSignedCookie(c, PRIVATE_KEY, "otg");
  if (!groupId) return c.body(null, 400);

  // Wait for the user to join the YPT group
  const user = await waitForMember(Number.parseInt(groupId));

  deleteCookie(c, "otg");
  await setSignedCookie(c, "user", JSON.stringify(user), PRIVATE_KEY);

  return c.html(<StatsLoader name={user.name} />);
});

app.post("/stats", async (c: Context) => {
  const serializedUser = await getSignedCookie(c, PRIVATE_KEY, "user");
  if (!serializedUser) return c.body(null, 400);

  const user = userSchema.parse(JSON.parse(serializedUser));

  // Generate the stats
  const stats = await getStudyStats(user.id);

  return c.html(<SummaryStats {...stats} />);
});

app.post("/image", async (c: Context) => {
  const userCookie = await getSignedCookie(c, PRIVATE_KEY, "user");
  if (!userCookie) return c.body(null, 400);

  const user = userSchema.parse(JSON.parse(userCookie));
  const studyStats = await getStudyStats(user.id);

  return c.json({ ...user, ...studyStats });
});

if (Deno.env.get("ENVIRONMENT") === "DEV") {
  // DELETE all the bot-created groups
  app.delete("/groups", async (c: Context) => {
    const count = await deleteAllGroups();
    return c.text(`Deleted ${count} groups`);
  });
}

Deno.serve({ port: 3000 }, app.fetch);
