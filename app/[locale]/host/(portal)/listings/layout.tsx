import type { ReactNode } from "react";
import { buildPrivateMetadata } from "@/lib/seo/static-route-metadata";
export const metadata = buildPrivateMetadata("Host listings | Nexa Stays");
export default function Layout({ children }: { children: ReactNode }) { return children; }