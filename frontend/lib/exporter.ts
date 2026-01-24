type Message = {
  role: string;
  content: string;
  created_at?: string;
};

type SessionDetail = {
  session_id: string;
  round: string;
  difficulty: string;
  created_at: string;
  messages: Message[];
  evaluation?: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
};

export function exportSessionJSON(session: SessionDetail) {
  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: "application/json",
  });

  download(blob, `${session.session_id}.json`);
}

export function exportSessionMarkdown(session: SessionDetail) {
  let md = `# Interview Session\n\n`;
  md += `**Session ID:** ${session.session_id}\n\n`;
  md += `**Round:** ${session.round}\n\n`;
  md += `**Difficulty:** ${session.difficulty}\n\n`;
  md += `**Created At:** ${session.created_at}\n\n`;
  md += `## Conversation\n\n`;

  session.messages.forEach((m) => {
    md += `**${m.role.toUpperCase()}**: ${m.content}\n\n`;
  });

  if (session.evaluation) {
    md += `## Evaluation\n\n`;
    md += `**Score:** ${session.evaluation.score}/10\n\n`;
    md += `### Strengths\n`;
    session.evaluation.strengths.forEach((s) => {
      md += `- ${s}\n`;
    });
    md += `\n### Improvements\n`;
    session.evaluation.improvements.forEach((i) => {
      md += `- ${i}\n`;
    });
  }

  const blob = new Blob([md], { type: "text/markdown" });
  download(blob, `${session.session_id}.md`);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
