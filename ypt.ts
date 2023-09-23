import { z } from "npm:zod";

/* Interface definitions */

interface YPTGroup {
  id: number;
  name: string;
  password: string;
  link: string;
}

interface YPTUser {
  id: number;
  name: string;
}

/* Zod schemas */

const createdGroupSchema = z.object({
  g: z.object({
    id: z.number(),
  }),
});

const groupMembersSchema = z.object({
  ms: z.array(z.object({
    ud: z.number(),
    n: z.string(),
  })),
});

const generatedLinkSchema = z.object({
  shortLink: z.string(),
});

type CreatedGroup = z.infer<typeof createdGroupSchema>;
type GroupMembers = z.infer<typeof groupMembersSchema>;
type GeneratedLink = z.infer<typeof generatedLinkSchema>;

/* Constants */

const YPT_BASE_URL = "https://pi.tgclab.com";
const YPT_JWT = Deno.env.get("YPT_JWT")!;
const YPT_AUTH_HEADER = { Authorization: "JWT " + YPT_JWT };
// Get the user ID contained in the JWT from YPT
const YPT_BOT_ID = Number.parseInt(
  JSON.parse(atob(YPT_JWT.split(".")[1])).user_id,
);

const FIREBASE_WEB_API_KEY = Deno.env.get("FIREBASE_WEB_API_KEY");

/* Functions to call HTTP APIs (reverse-engineered from YPT Android app) */

/** Request to create a YPT group. */
async function reqCreateGroup(
  options: {
    title: string;
    notice: string;
    goalTime: number;
    password: string;
    maxMemberCount: number;
  },
): Promise<CreatedGroup> {
  // Construct the request body
  const body = { ...options, categoryId: 84, inviteLink: "link", new: true };

  // Send the request
  const res = await fetch(
    `${YPT_BASE_URL}/group/make`,
    { method: "POST", headers: YPT_AUTH_HEADER, body: JSON.stringify(body) },
  );

  // Parse the response
  const json = await res.json();
  console.log(json);

  return createdGroupSchema.parse(json);
}

/** Request to delete a YPT group. */
async function reqDeleteGroup(groupId: number) {
  // Construct the request body
  const body = { id: groupId };

  // Send the request
  await fetch(
    `${YPT_BASE_URL}/group/delete`,
    { method: "POST", headers: YPT_AUTH_HEADER, body: JSON.stringify(body) },
  );
}

/** Request to get the groups members in a group. */
async function reqGroupMembers(groupId: number): Promise<GroupMembers> {
  // Send the request
  const res = await fetch(
    // This API enpoint doesn't seem to require any authentication...
    `${YPT_BASE_URL}/logs/group/members?groupID=${groupId}`,
  );

  // Parse the response
  const json = await res.json();
  console.log(json);

  return groupMembersSchema.parse(json);
}

/** Request to generate a shortened YPT group invite link. */
async function reqInviteLink(groupId: number): Promise<GeneratedLink> {
  const ogImageUrl =
    "https://firebasestorage.googleapis.com/v0/b/yeolpumta-deeplink/o/social_images%2Fogtag_studygroup_en.png?alt=media&token=427f0278-8222-4afd-9b9e-a12d3b705764";
  const link = `https://yeolpumta.com/invite?type=study&groupId=${groupId}`;

  // URL parameter comments from Firebase docs (https://firebase.google.com/docs/dynamic-links/create-manually)
  const longDynamicLink = "https://invite.yeolpumta.com" +
    // "The link your app will open"
    `?link=${encodeURIComponent(link)}` +
    // "The title to use when the Dynamic Link is shared in a social post"
    "&st=ypt-stats" +
    // "The description to use when the Dynamic Link is shared in a social post"
    `&sd=${decodeURIComponent("Join this YPT group!")}` +
    // "The URL to an image related to this link"
    `&si=${decodeURIComponent(ogImageUrl)}` +
    // "Google Play analytics parameters"
    "&utm_campaign=grouplink" +
    "&utm_medium=invite" +
    "&utm_source=pallo" +
    // "iTunes Connect analytics parameters"
    "&pt=pallo" +
    // "The package name of the Android app to use to open the link"
    "&apn=com.pallo.passiontimerscoped" +
    // "The bundle ID of the iOS app to use to open the link"
    "&ibi=com.pallo.passionTimerScoped" +
    // "Your app's App Store ID, used to send users to the App Store when the app isn't installed"
    "&isi=1441909643";

  // Construct the request body
  const body = {
    longDynamicLink,
    suffix: { option: "SHORT" },
  };

  // Send the request
  const res = await fetch(
    `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${FIREBASE_WEB_API_KEY}`,
    { method: "POST", body: JSON.stringify(body) },
  );

  // Parse the response
  return generatedLinkSchema.parse(await res.json());
}

/** Request to set the invite link on a group's invite page. */
async function reqSetInviteInfo(groupId: number, inviteLink: string) {
  // Construct the request body
  const body = { id: groupId, inviteLink };

  // Send the request
  await fetch(
    `${YPT_BASE_URL}/group/info/edit`,
    { method: "POST", headers: YPT_AUTH_HEADER, body: JSON.stringify(body) },
  );
}

/* Higher-level functions for iterfacing with YPT */

/** Creates a group on YPT with space for one user. */
export async function createOneTimeGroup(): Promise<YPTGroup> {
  // TODO: generate name (adjective colour animal)
  const name = `ypt stats [${Math.floor(10 + Math.random() * 90).toString()}]`;
  const password = Math.floor(1000 + Math.random() * 9000).toString();

  // Create the study group
  const createGroupRes = await reqCreateGroup({
    title: name,
    notice: "ypt-stats.deno.dev",
    goalTime: 0,
    password,
    maxMemberCount: 2,
  });

  const groupId = createGroupRes.g.id;

  // Generate the invite shortlink
  const generateLinkRes = await reqInviteLink(groupId);
  // await reqSetInviteInfo(groupId, generateLinkRes.shortLink);

  return { id: groupId, name, password, link: generateLinkRes.shortLink };
}

/**
 * Waits for a user to join the group, then deletes
 * the group and returns the user's details.
 */
export async function waitForMember(groupId: number): Promise<YPTUser> {
  let members = await reqGroupMembers(groupId);

  // Poll the group members endpoint until a user joins the group
  while (members.ms.length < 2) {
    // Sleep for 2s
    await new Promise((r) => setTimeout(r, 2000));

    // Refesh the members array
    members = await reqGroupMembers(groupId);
  }

  // Delete the group
  await reqDeleteGroup(groupId);

  // Get the details of the user that joined
  const { ud: id, n: name } = members.ms.find(({ ud }) => ud !== YPT_BOT_ID)!;

  return { id, name };
}
