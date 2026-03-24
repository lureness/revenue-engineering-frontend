import type { ReactNode } from "react";

import "grapesjs/dist/css/grapes.min.css";
import "./lp-editor.css";

type LandingPagesLayoutProps = {
  children: ReactNode;
};

export default function LandingPagesLayout({
  children,
}: LandingPagesLayoutProps) {
  return children;
}
