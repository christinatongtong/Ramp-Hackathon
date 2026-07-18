import { AvatarProvider } from "./AvatarProvider";

export function GameProviders({ children }: { children: React.ReactNode }) {
  return <AvatarProvider>{children}</AvatarProvider>;
}
