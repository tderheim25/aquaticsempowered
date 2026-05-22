import { redirect } from "next/navigation";

// Pool creation now happens in a modal on the pools page; this route just opens it.
export default function NewPoolPage() {
  redirect("/app/pools?add=1");
}
