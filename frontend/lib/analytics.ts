type Session = {
  round: string;
  evaluation?: { score: number } | null;
};

export function computeAnalytics(sessions: Session[]) {
  const total = sessions.length;

  const byRound = {
    HR: 0,
    DSA: 0,
    SD: 0,
  };

  let hrScoreSum = 0;
  let hrScoreCount = 0;

  sessions.forEach((s) => {
    if (byRound[s.round as keyof typeof byRound] !== undefined) {
      byRound[s.round as keyof typeof byRound]++;
    }

    if (s.round === "HR" && s.evaluation?.score !== undefined) {
      hrScoreSum += s.evaluation.score;
      hrScoreCount++;
    }
  });

  const avgHrScore =
    hrScoreCount > 0 ? Math.round((hrScoreSum / hrScoreCount) * 10) / 10 : null;

  return {
    total,
    byRound,
    avgHrScore,
  };
}
