import { Context, Hono } from "npm:hono";
import {
  deleteCookie,
  getSignedCookie,
  setSignedCookie,
} from "npm:hono/cookie";

import { setup, tw } from "npm:twind";
import { getStyleTag, virtualSheet } from "npm:twind/sheets";

// import "https://deno.land/std@0.202.0/dotenv/load.ts";
// import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

import {
  createOneTimeGroup,
  deleteAllGroups,
  getStudyStats,
  Stats,
  userSchema,
  waitForMember,
} from "./ypt.ts";

const PRIVATE_KEY = Deno.env.get("PRIVATE_KEY")!;

const app = new Hono();

const JoinGroup = (props: {
  name: string;
  password: string;
  link: string;
}) => (
  <>
    <p hx-get="/stats-loader" hx-trigger="load">
      join this group rn <a href={props.link}>{props.name}</a>
    </p>
    (password is {props.password})
  </>
);

const StatsLoader = (props: { name: string }) => (
  <>
    <h1 hx-post="/stats" hx-trigger="load" hx-target="#stats">
      hi {props.name}
    </h1>
    <p>im loading your stats (alr deleted the grp)</p>
    <div id="stats"></div>
  </>
);

const SummaryStats = (props: Stats) => (
  <>
    <p>
      {Math.round(props.totalStudyTime / 1000 / 60 / 60)}h total study time!!!
    </p>
    <p>i havent formatted these: {JSON.stringify(props)}</p>
  </>
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

  // Wait for the user to join the YPT group
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

if (Deno.env.get("ENVIRONMENT") === "DEV") {
  // DELETE all the bot-created groups
  app.delete("/groups", async (c) => {
    const count = await deleteAllGroups();
    return c.text(`Deleted ${count} groups`);
  });
}

Deno.serve({ port: 3000 }, app.fetch);
