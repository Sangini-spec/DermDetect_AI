import { jsPDF } from 'jspdf';
import type { Patient } from '../types';

export const exportPatientPDF = async (patient: Patient) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Pages, coordinates
  let y = 15;
  const margin = 15;
  const pageWidth = 210;
  const pageHeight = 297;
  const contentWidth = pageWidth - (margin * 2);

  // Helper for text wrapping & printing
  const addText = (text: string, x: number, lineSpacing: number = 6, fontSize: number = 10, style: 'normal' | 'bold' | 'italic' = 'normal', color: [number, number, number] = [51, 65, 85]) => {
    doc.setFont('Helvetica', style);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth - (x - margin));
    for (const line of lines) {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 15;
        // Repeat minimal header on next pages
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Clinical Report: ${patient.name} (ID: ${patient.patientId || 'N/A'})`, margin, y);
        doc.line(margin, y + 2, margin + contentWidth, y + 2);
        y += 8;
        doc.setFont('Helvetica', style);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
      }
      doc.text(line, x, y);
      y += lineSpacing;
    }
  };

  // 1. Draw elegant Report Header
  doc.setFillColor(74, 144, 226); // primary blue
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("DermDetect AI - Clinical Progression Report", margin + 6, y + 9);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(234, 242, 250);
  doc.text(`Generated on ${new Date().toLocaleDateString()} - Electronic Health Record`, margin + 6, y + 15);

  y += 30;

  // 2. Patient Demographics & Profile Box
  doc.setFillColor(248, 250, 252); // soft slate background
  doc.setDrawColor(226, 232, 240); // borders
  doc.rect(margin, y, contentWidth, 38, 'FD');

  addText("PATIENT PROFILE", margin + 6, 6, 11, 'bold', [15, 23, 42]);
  y += 2;
  
  const col1X = margin + 6;
  const col2X = margin + 65;
  const col3X = margin + 120;

  // Demographic details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Full Name:", col1X, y);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(patient.name, col1X + 20, y);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Date of Birth:", col2X, y);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(patient.dob || 'N/A', col2X + 22, y);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Patient ID:", col3X, y);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(patient.patientId || 'N/A', col3X + 18, y);

  y += 8;

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Gender:", col1X, y);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(patient.gender || 'Prefer not to say', col1X + 20, y);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Blood Type:", col2X, y);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(patient.bloodType || 'N/A', col2X + 22, y);

  y += 8;

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Clinical Notes / Allergies:", col1X, y);
  y += 5;
  addText(patient.existingConditions || "No chronic active complaints or existing circumstances logged.", col1X, 5, 9, 'normal', [71, 85, 105]);

  y += 10;

  // 3. Document Scan Logs
  addText("TEMPORAL AI SCANS HISTORY", margin, 8, 13, 'bold', [15, 23, 42]);
  doc.setLineWidth(0.5);
  doc.setDrawColor(74, 144, 226);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  if (patient.lesionImages.length === 0) {
    addText("No historical visual scans added for this patient profile.", margin, 6, 10, 'italic', [100, 116, 139]);
  } else {
    for (let i = 0; i < patient.lesionImages.length; i++) {
      const img = patient.lesionImages[i];
      const result = img.analysisResult;
      
      // Page space constraint checking
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      addText(`Scan #${patient.lesionImages.length - i}: ${result?.conditionName || 'Analysis Pending'}`, margin, 7, 11, 'bold', [15, 23, 42]);
      addText(`Captured on: ${new Date(img.timestamp).toLocaleString()}`, margin, 5, 8.5, 'normal', [100, 116, 139]);
      
      if (result) {
        addText(`Model Confidence: ${result.confidence}`, margin, 5, 9, 'bold', result.confidence.toLowerCase() === 'high' ? [16, 185, 129] : [245, 158, 11]);
        y += 2;
        addText(`Description: ${result.description}`, margin, 5, 9.5, 'normal', [51, 65, 85]);
        
        y += 2;
        addText("Clinical Recommendations & Safeguards:", margin, 5, 9.5, 'bold', [15, 23, 42]);
        y += 1;
        result.recommendations.forEach((rec) => {
          addText(`• ${rec}`, margin + 4, 4.5, 8.5, 'normal', [71, 85, 105]);
        });
      }

      // Try capturing base64 image and inserting it right next to it!
      if (img.imageDataUrl) {
        try {
          if (y + 40 > pageHeight - 25) {
            doc.addPage();
            y = 20;
          }
          // The dataUrl is base64. Ensure we correctly pass format, JPEG or PNG based on type if possible, default JPEG
          doc.addImage(img.imageDataUrl, 'JPEG', margin, y, 40, 40);
          y += 44; // spacing
        } catch (imageErr) {
          console.warn("Could not render image onto PDF", imageErr);
          y += 4;
        }
      } else {
        y += 6;
      }

      // Spacer line between scans
      if (i < patient.lesionImages.length - 1) {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        } else {
          doc.setLineWidth(0.2);
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y, margin + contentWidth, y);
          y += 8;
        }
      }
    }
  }

  // 4. Clinical Advisory Bottom Box
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 20;
  }
  
  y += 6;
  doc.setFillColor(254, 243, 199); // light amber
  doc.setDrawColor(245, 158, 11); // amber line
  doc.rect(margin, y, contentWidth, 22, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(154, 98, 0); // amber dark text
  doc.text("MEDICAL ADVISORY BOARD NOTICE:", margin + 4, y + 6);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 80, 0);
  const disclaimerText = "DermDetect AI outputs represent research-stage machine learning predictions rather than verified medical diagnostics. This document is provided solely to organize patient visual progression history and assist doctor-facilitated medical consultations. Under no circumstances should medication, lifestyle adjustments, or treatments be prescribed or configured entirely based on this electronic report.";
  const disclaimerSplit = doc.splitTextToSize(disclaimerText, contentWidth - 8);
  doc.text(disclaimerSplit, margin + 4, y + 10);

  // Download Action
  const filename = `${patient.name.toLowerCase().replace(/\s+/g, '_')}_clinical_report.pdf`;
  doc.save(filename);
};
