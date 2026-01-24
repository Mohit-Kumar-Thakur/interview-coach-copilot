import jsPDF from "jspdf";

export function exportSessionPDF(session: {
  session_id: string;
  round: string;
  difficulty: string;
  created_at: string;
  messages: {
    role: string;
    content: string;
    evaluation?: { score: number } | null;
  }[];
}) {
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(14);
  doc.text("Interview Session Report", 10, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Session ID: ${session.session_id}`, 10, y); y += 6;
  doc.text(`Round: ${session.round}`, 10, y); y += 6;
  doc.text(`Difficulty: ${session.difficulty}`, 10, y); y += 6;
  doc.text(`Created: ${new Date(session.created_at).toLocaleString()}`, 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text("Conversation", 10, y);
  y += 6;

  session.messages.forEach((m, i) => {
    if (y > 270) {
      doc.addPage();
      y = 10;
    }

    doc.setFontSize(10);
    doc.text(`${m.role.toUpperCase()}:`, 10, y);
    y += 5;

    const lines = doc.splitTextToSize(m.content, 180);
    doc.text(lines, 10, y);
    y += lines.length * 5;

    if (m.evaluation?.score !== undefined) {
      doc.text(`Score: ${m.evaluation.score}/10`, 10, y);
      y += 6;
    }

    y += 4;
  });

  doc.save(`session_${session.session_id}.pdf`);
}
