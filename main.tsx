/** @jsx jsx */
import { Hono } from "https://deno.land/x/hono@v3.7.0-rc.1/mod.ts";
import { jsx } from "https://deno.land/x/hono@v3.7.0-rc.1/middleware.ts";
import {
  getSignedCookie,
  setSignedCookie,
} from "https://deno.land/x/hono@v3.7.1/helper.ts";
import { z } from "npm:zod";
import { Resvg } from "npm:@resvg/resvg-js";
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";
import { createOneTimeGroup, waitForMember } from "./ypt.ts";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const PRIVATE_KEY = Deno.env.get("PRIVATE_KEY")!;

const app = new Hono();

// Homepage
app.get("/", (c) => c.html(<h1>hi!!</h1>));

app.get("/otg", async (c) => {
  // Create a one-time YPT group to identify and authenticate the user
  const group = await createOneTimeGroup();

  await setSignedCookie(c, "otg", group.id.toString(), PRIVATE_KEY);
  return c.json(group);
});

app.get("/stats", async (c) => {
  const groupId = await getSignedCookie(c, PRIVATE_KEY, "otg");

  if (!groupId) return c.body(null, 400);

  const user = await waitForMember(Number.parseInt(groupId));
  await setSignedCookie(c, "user", JSON.stringify(user), PRIVATE_KEY);

  return c.json(user);
});

app.get("/image", async (c) => {
  const userCookie = await getSignedCookie(c, PRIVATE_KEY, "user");

  if (!userCookie) return c.body(null, 400);

  const user = userSchema.parse(JSON.parse(userCookie));

  return c.json(user);
});

Deno.serve({ port: 3000 }, app.fetch);
