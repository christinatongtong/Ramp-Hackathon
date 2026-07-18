import { loadProblem } from "@/lib/loadProblem";
import { ProblemExperience } from "@/components/ProblemExperience";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = await params;
  const problem = await loadProblem(problemId);

  return <ProblemExperience problem={problem} />;
}
