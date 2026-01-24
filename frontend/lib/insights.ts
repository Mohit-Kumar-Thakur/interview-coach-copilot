type Evaluation = {
  strengths?: string[];
  improvements?: string[];
};

type Session = {
  round: string;
  evaluation?: Evaluation | null;
};

export function computeInsights(sessions: Session[]) {
  const strengthCount: Record<string, number> = {};
  const improvementCount: Record<string, number> = {};

  sessions.forEach((s) => {
    if (s.round !== "HR" || !s.evaluation) return;

    s.evaluation.strengths?.forEach((str) => {
      strengthCount[str] = (strengthCount[str] || 0) + 1;
    });

    s.evaluation.improvements?.forEach((imp) => {
      improvementCount[imp] = (improvementCount[imp] || 0) + 1;
    });
  });

  const topStrength =
    Object.entries(strengthCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const topImprovement =
    Object.entries(improvementCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  let recommendation = null;
  if (topImprovement) {
    recommendation = `Focus on improving: ${topImprovement}`;
  }

  return {
    topStrength,
    topImprovement,
    recommendation,
  };
}
