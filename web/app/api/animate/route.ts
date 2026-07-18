import { NextResponse } from "next/server";
import type { CompileAnimationRequest, CompileAnimationResponse } from "@/lib/animation-engine/types";
import { analyzeCodeSafety } from "@/lib/animation-engine/codeRunner";
import { rottingOrangesToSceneScript } from "@/problems/rotting-oranges/toSceneScript";
import type { Grid } from "@/lib/rotting-oranges/types";

/**
 * POST /api/animate
 *
 * Future: LLM reads user code + problem prompt template → SceneScript JSON.
 * MVP: safety checks + reference adapter fallback.
 */
export async function POST(request: Request) {
  let body: CompileAnimationRequest;
  try {
    body = (await request.json()) as CompileAnimationRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const safety = analyzeCodeSafety(body.code);
  if (safety && !safety.ok) {
    const script = rottingOrangesToSceneScript({
      grid: (body.input.grid as Grid) ?? [[2, 1, 1]],
      verdict: safety.reason === "infinite_loop" ? "timeout" : "runtime_error",
      note: safety.message,
    });
    const response: CompileAnimationResponse = { script, source: "sandbox" };
    return NextResponse.json(response);
  }

  if (body.problemId === "rotting-oranges" && body.input.grid) {
    const script =
      body.referenceScript ??
      rottingOrangesToSceneScript({
        grid: body.input.grid as Grid,
        verdict: "correct",
      });
    const response: CompileAnimationResponse = { script, source: "reference" };
    return NextResponse.json(response);
  }

  return NextResponse.json({ error: `Unknown problem: ${body.problemId}` }, { status: 404 });
}
