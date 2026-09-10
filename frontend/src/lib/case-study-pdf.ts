import { jsPDF } from 'jspdf';
import { CaseStudy } from './types';

export function generateCaseStudyPDF(study: CaseStudy) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 24;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 22) {
      doc.addPage();
      cursorY = 24;
      drawHeaderBanner();
    }
  };

  const drawHeaderBanner = () => {
    // Top gradient accent line
    doc.setFillColor(249, 115, 22); // coral-500
    doc.rect(margin, 12, contentWidth, 1.5, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('CORALSWIFT TECHNOLOGIES • ENTERPRISE ENGINEERING BRIEF', margin, 18);
  };

  // 1. Initial Page Header
  drawHeaderBanner();
  cursorY = 30;

  // Badge: Industry & Verified
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(249, 115, 22); // Coral
  doc.text(`${study.industry.toUpperCase()}  •  VERIFIED PRODUCTION DEPLOYMENT`, margin, cursorY);
  cursorY += 8;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(11, 20, 38); // Dark Navy
  const titleLines = doc.splitTextToSize(study.title, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 8 + 4;

  // Client & Project Context
  if (study.client_name) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text(`Client Partner: `, margin, cursorY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${study.client_name}`, margin + 26, cursorY);
    cursorY += 7;
  }

  if (study.project_context) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const contextLines = doc.splitTextToSize(study.project_context, contentWidth);
    doc.text(contextLines, margin, cursorY);
    cursorY += contextLines.length * 5 + 6;
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, margin + contentWidth, cursorY);
  cursorY += 8;

  // 2. Telemetry Metrics Section
  if (study.outcome_metrics && study.outcome_metrics.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(11, 20, 38);
    doc.text('VERIFIED TELEMETRY METRICS', margin, cursorY);
    cursorY += 7;

    const colWidth = (contentWidth - 6) / 2;
    const cardHeight = 18;

    study.outcome_metrics.forEach((m, idx) => {
      const col = idx % 2;
      const x = margin + col * (colWidth + 6);
      
      if (idx > 0 && col === 0) {
        cursorY += cardHeight + 4;
        checkPageBreak(cardHeight + 4);
      }

      // Card Box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(x, cursorY, colWidth, cardHeight, 2, 2, 'FD');

      // Metric Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(249, 115, 22); // coral-500
      doc.text(m.metric, x + 4, cursorY + 7);

      // Metric Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      const labelLines = doc.splitTextToSize(m.label, colWidth - 8);
      doc.text(labelLines, x + 4, cursorY + 13);
    });

    cursorY += cardHeight + 10;
  }

  // Helper to render standard sections
  const renderSection = (heading: string, body: string, accentColor: [number, number, number] = [11, 20, 38]) => {
    if (!body) return;
    const lines = doc.splitTextToSize(body, contentWidth);
    const needed = 12 + lines.length * 5;
    checkPageBreak(Math.min(needed, 40));

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(heading, margin, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(lines, margin, cursorY);
    cursorY += lines.length * 5 + 8;
  };

  // 3. Challenge
  if (study.challenge) {
    renderSection('The Engineering Challenge', study.challenge, [225, 29, 72]); // rose-600
  }

  // 4. Solution
  if (study.solution) {
    renderSection('The Engineered Solution', study.solution, [16, 185, 129]); // emerald-600
  }

  // 5. Implementation
  if (study.implementation) {
    renderSection('Architecture & Implementation Details', study.implementation, [79, 70, 229]); // indigo-600
  }

  // 6. Technology Stack
  if (study.tech_stack && study.tech_stack.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(11, 20, 38);
    doc.text('Technology & Infrastructure Stack', margin, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const techText = study.tech_stack.join('  •  ');
    const techLines = doc.splitTextToSize(techText, contentWidth);
    doc.text(techLines, margin, cursorY);
    cursorY += techLines.length * 5 + 8;
  }

  // 7. Add Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, margin + contentWidth, pageHeight - 14);

    // Left & Right Footer text
    doc.text('Confidential • CoralSwift Technologies Inc. • https://coralswift.com', margin, pageHeight - 9);
    doc.text(`Page ${i} of ${totalPages}`, margin + contentWidth - 16, pageHeight - 9);
  }

  // Download the PDF
  doc.save(`coralswift-case-study-${study.slug || 'brief'}.pdf`);
}
