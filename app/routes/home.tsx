import { Welcome } from "../welcome/welcome";

export function meta() {
  return [
    { title: "Multiplayer beats" },
    { name: "description", content: "Time to beat the game ;)" },
  ];
}

export default function Home() {
  return <Welcome />;
}
