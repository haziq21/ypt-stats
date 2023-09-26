/** @jsx jsx */
import { jsx } from "https://deno.land/x/hono@v3.7.0-rc.1/middleware.ts";
import { Hono } from "npm:hono";
import {
  deleteCookie,
  getSignedCookie,
  setSignedCookie,
} from "npm:hono/cookie";
import { z } from "npm:zod";

import "https://deno.land/std@0.202.0/dotenv/load.ts";
// import { Resvg } from "npm:@resvg/resvg-js";
// import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";
import {
  createOneTimeGroup,
  getStudyStats,
  Stats,
  waitForMember,
} from "./ypt.ts";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const PRIVATE_KEY = Deno.env.get("PRIVATE_KEY")!;

const app = new Hono();

const SummaryStats = (props: Stats) => (
  <div>
    <p>
      {Math.round(props.totalStudyTime / 1000 / 60 / 60)}h total study time!!!
    </p>
    <p>i havent formatted these: {JSON.stringify(props)}</p>
  </div>
);

const JoinGroup = (props: {
  name: string;
  password: string;
  link: string;
}) => (
  <div hx-get="/stats-loader" hx-trigger="load">
    <p>
      join this group rn <a href={props.link}>{props.name}</a>
    </p>
    (password is {props.password})
  </div>
);

const StatsLoader = (props: { name: string }) => (
  <div hx-post="/stats" hx-trigger="load" hx-target="#stats">
    <h1>hi {props.name}</h1>
    <p>im loading your stats (alr deleted the grp)</p>
    <div id="stats"></div>
  </div>
);

// Homepage
app.get("/", (c) => {
  // TODO: check if the "user" cookie is set

  return c.html(
    <html>
      <head>
        <title>YPT stats generator</title>
        <script src="https://unpkg.com/htmx.org@1.9.6"></script>
      </head>
      <body hx-target="body">
        <p>hi this is the ypt stats generator!!</p>
        <button hx-post="/otg">lets GOo</button>
      </body>
    </html>,
  );
});

app.post("/otg", async (c) => {
  // Create a one-time YPT group to identify and authenticate the user
  const group = await createOneTimeGroup();
  // So we can identify the user on the /stats endpoint
  await setSignedCookie(c, "otg", group.id.toString(), PRIVATE_KEY);

  return c.html(<JoinGroup {...group} />);
});

app.get("/stats-loader", async (c) => {
  const groupId = await getSignedCookie(c, PRIVATE_KEY, "otg");
  if (!groupId) return c.body(null, 400);

  const user = await waitForMember(Number.parseInt(groupId));

  deleteCookie(c, "otg");
  await setSignedCookie(c, "user", JSON.stringify(user), PRIVATE_KEY);

  return c.html(<StatsLoader name={user.name} />);
});

app.post("/stats", async (c) => {
  const serializedUser = await getSignedCookie(c, PRIVATE_KEY, "user");
  if (!serializedUser) return c.body(null, 400);

  const user = userSchema.parse(JSON.parse(serializedUser));

  // Generate the stats
  const stats = await getStudyStats(user.id);

  return c.html(<SummaryStats {...stats} />);
});

app.post("/image", async (c) => {
  const userCookie = await getSignedCookie(c, PRIVATE_KEY, "user");
  if (!userCookie) return c.body(null, 400);

  const user = userSchema.parse(JSON.parse(userCookie));
  const studyStats = await getStudyStats(user.id);

  return c.json({ ...user, ...studyStats });
});

Deno.serve({ port: 3000 }, app.fetch);
