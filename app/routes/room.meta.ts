import type { Route } from "./+types/room";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Room ${params.roomId} - Multiplayer Beats` },
    { name: "description", content: "Collaborative beat making session" },
  ];
}
