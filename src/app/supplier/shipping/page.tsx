import { redirect } from "next/navigation";

/** A antiga tela de expedição foi substituída pela esteira ao vivo. */
export default function ShippingRedirect() {
  redirect("/supplier/dispatch");
}
