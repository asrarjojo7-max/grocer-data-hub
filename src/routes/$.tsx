import { createFileRoute } from "@tanstack/react-router";
import App from "../App";

// Catch-all route — delegates all paths to the internal react-router App.
// This lets us preserve the original project's routing structure intact.
export const Route = createFileRoute("/$")({
  component: App,
});
