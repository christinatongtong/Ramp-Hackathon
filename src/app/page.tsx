import Link from "next/link";
import { listProblemIds, loadProblemSummary } from "@/lib/loadProblem";

export default async function HomePage() {
  const ids = await listProblemIds();
  const problems = await Promise.all(ids.map(loadProblemSummary));

  return (
    <main>
      <h1>Problems</h1>
      <ul>
        {problems.map((problem) => (
          <li key={problem.id}>
            <Link href={`/problems/${problem.id}`}>
              {problem.number}. {problem.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
