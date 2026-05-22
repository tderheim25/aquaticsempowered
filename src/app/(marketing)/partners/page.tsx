import { redirect } from "next/navigation";

/** Legacy route — vendor marketplace lives at /vendors */
export default function PartnersPage() {
  redirect("/vendors");
}
