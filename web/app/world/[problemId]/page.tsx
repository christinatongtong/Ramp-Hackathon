import { AlgorithmGame } from "@/components/game/AlgorithmGame";

type WorldPageProps = {
  params: Promise<{ problemId: string }>;
};

export default async function WorldPage({ params }: WorldPageProps) {
  const { problemId } = await params;
  return <AlgorithmGame problemId={problemId} />;
}
