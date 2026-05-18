import { redirect } from "next/navigation";

/** Feed lives on the marketing route so it stays out of the portal shell. */
export default function AppCommunityFeedRedirect() {
  redirect("/community");
}
