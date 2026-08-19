// Backward-compatible export. The canonical catalog now contains every parsed logo.
import { bahrainLogoCatalog } from "@/data/bahrain-logo-catalog";

export const bahrainLogoFallback = bahrainLogoCatalog.map(({ name, url }) => ({ name, url }));
