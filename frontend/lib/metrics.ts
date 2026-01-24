type Evaluation = {
  score?: number;
};

type Session = {
  round: string;
  created_at: string;
  evaluation?: Evaluation | null;
};

export function computeMetrics(sessions: Session[]) {
  const total = sessions.length;

  const hrSessions = sessions.filter((s) => s.round === "HR" && s.evaluation);
  const hrCount = hrSessions.length;

  const avgHrScore =
    hrCount === 0
      ? null
      : (
          hrSessions.reduce((sum, s) => sum + (s.evaluation?.score ?? 0), 0) /
          hrCount
        ).toFixed(1);

  const lastSessionDate =
    sessions.length === 0
      ? null
      : new Date(
          sessions
            .map((s) => new Date(s.created_at).getTime())
            .sort((a, b) => b - a)[0]
        ).toLocaleDateString();

  return {
    total,
    hrCount,
    avgHrScore,
    lastSessionDate,
  };
}
