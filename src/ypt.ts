import { z } from "npm:zod";

/* Interface definitions */

interface Group {
  id: number;
  name: string;
  password: string;
  link: string;
}

export interface Stats {
  totalStudyTime: number;
  totalAllowedAppTime: number;
  longestStreak: number;
  subjectTimings: Record<string, number>;
}

/* Zod schemas */

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const groupsSchema = z.object({
  gs: z.array(z.object({
    id: z.number(),
  })),
});

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

const studyDataSchema = z.object({
  ls: z.array(z.object({
    // Date as YYYY-MM-DD
    dt: z.string(),
    // Total study time
    sm: z.number(),
    // Longest session
    mm: z.number(),
    // Username
    n: z.string(),
    // Study timings
    ls: z.array(z.object({
      // Subject
      sb: z.string(),
      // Time spent
      sm: z.number(),
      // Start time
      st: z.union([z.string(), z.number()]),
    })),
    // Allowed app usage timings
    as: z.array(z.object({
      // Subject
      sb: z.string(),
      // Usage duration
      sm: z.number(),
      // Start time
      st: z.string(),
    })),
  })),
});

export type User = z.infer<typeof userSchema>;
type Groups = z.infer<typeof groupsSchema>;
type CreatedGroup = z.infer<typeof createdGroupSchema>;
type GroupMembers = z.infer<typeof groupMembersSchema>;
type GeneratedLink = z.infer<typeof generatedLinkSchema>;
type StudyData = z.infer<typeof studyDataSchema>;

/* Constants */

const FIREBASE_WEB_API_KEY = Deno.env.get("FIREBASE_WEB_API_KEY");
const YPT_BASE_URL = "https://pi.tgclab.com";
const YPT_JWT = Deno.env.get("YPT_JWT")!;
const YPT_AUTH_HEADER = { Authorization: "JWT " + YPT_JWT };
// Get the user ID contained in the JWT from YPT
const YPT_BOT_ID = Number.parseInt(
  JSON.parse(atob(YPT_JWT.split(".")[1])).user_id,
);

/* Functions to call HTTP APIs (reverse-engineered from YPT Android app) */

/** Request to get all the groups owned by the bot. */
async function reqGroups(): Promise<Groups> {
  // Send the request
  const res = await fetch(
    `${YPT_BASE_URL}/group/groups`,
    { headers: YPT_AUTH_HEADER },
  );

  return groupsSchema.parse(await res.json());
}

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
  // console.log(json);

  return groupMembersSchema.parse(json);
}

/** Request to generate a shortened YPT group invite link. */
async function reqInviteLink(groupId: number): Promise<GeneratedLink> {
  const ogTitle = "One-time group for YPT Stats";
  const ogDescription = "Join this group to log in on YPT Stats.";
  const ogImageUrl =
    "https://firebasestorage.googleapis.com/v0/b/yeolpumta-deeplink/o/social_images%2Fogtag_studygroup_en.png?alt=media&token=427f0278-8222-4afd-9b9e-a12d3b705764";
  const link = `https://yeolpumta.com/invite?type=study&groupId=${groupId}`;

  // URL parameter comments from Firebase docs (https://firebase.google.com/docs/dynamic-links/create-manually)
  const longDynamicLink = "https://invite.yeolpumta.com" +
    // "The link your app will open"
    `?link=${encodeURIComponent(link)}` +
    // "The title to use when the Dynamic Link is shared in a social post"
    `&st=${encodeURIComponent(ogTitle)}` +
    // "The description to use when the Dynamic Link is shared in a social post"
    `&sd=${encodeURIComponent(ogDescription)}` +
    // "The URL to an image related to this link"
    `&si=${encodeURIComponent(ogImageUrl)}` +
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

/** Request to get a user's full study log. */
async function reqStudyData(
  userId: number,
  startDate: string,
  endDate: string,
): Promise<StudyData> {
  // Construct the request body
  const body = {
    id: userId,
    // Not sure what this does
    isMember: true,
    startDate,
    endDate,
  };

  // Send the request
  const res = await fetch(
    `${YPT_BASE_URL}/logs/range/days`,
    { method: "POST", headers: YPT_AUTH_HEADER, body: JSON.stringify(body) },
  );

  // Parse the response
  return studyDataSchema.parse(await res.json());
}

/* Higher-level functions for iterfacing with YPT */

/** Creates a group on YPT with space for one user. */
export async function createOneTimeGroup(): Promise<Group> {
  // TODO: generate better name
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
  // This isn't really necessary for the purposes of the one-time group
  // await reqSetInviteInfo(groupId, generateLinkRes.shortLink);

  return { id: groupId, name, password, link: generateLinkRes.shortLink };
}

/**
 * Waits for a user to join the group, then deletes
 * the group and returns the user's details.
 */
export async function waitForMember(groupId: number): Promise<User> {
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

/** Fetches and computes a user's study statistics. */
export async function getStudyStats(userId: number): Promise<Stats> {
  const studyData = await reqStudyData(userId, "2000-1-1", "3000-1-1");

  let totalStudyTime = 0;
  let totalAllowedAppTime = 0;

  // Maximum number of consecutive days studied
  let longestStreak = 0;
  // Number of consecutive days studied
  let currentStreak = 0;
  // Date (Unix timestamp) of the last day of the most recent streak
  let lastStreakEnd = 0;

  const subjectTimings: Record<string, number> = {};

  // Go through every day with a study log
  for (const studyDay of studyData.ls) {
    totalStudyTime += studyDay.sm;

    const date = Date.parse(studyDay.dt);

    // Update the current and longest streak
    if (date - lastStreakEnd === 1000 * 60 * 60 * 24) {
      currentStreak += 1;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }

    lastStreakEnd = date;

    // Calculate total amount of time spent on allowed apps on this day
    for (const allowedAppSession of studyDay.as) {
      totalAllowedAppTime += allowedAppSession.sm;
    }

    // Calculate total amount of timee spent on each subject
    for (const studySession of studyDay.ls) {
      if (!Object.hasOwn(subjectTimings, studySession.sb)) {
        subjectTimings[studySession.sb] = 0;
      }

      subjectTimings[studySession.sb] += studySession.sm;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { totalStudyTime, totalAllowedAppTime, longestStreak, subjectTimings };
}

/** Deletes all the groups created by the bot. */
export async function deleteAllGroups(): Promise<number> {
  const groupRes = await reqGroups();

  for (const group of groupRes.gs) {
    reqDeleteGroup(group.id);
  }

  return groupRes.gs.length;
}
