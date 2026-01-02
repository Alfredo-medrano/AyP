import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportColumn {
    header: string;
    key: string;
    width?: number;
}

interface ExportOptions {
    filename: string;
    title?: string;
    subtitle?: string;
    columns: ExportColumn[];
    data: Record<string, unknown>[];
}

/**
 * Export data to Excel (.xlsx)
 */
export function exportToExcel(options: ExportOptions): void {
    const { filename, columns, data } = options;

    // Create worksheet data
    const worksheetData = [
        columns.map(col => col.header), // Headers
        ...data.map(row => columns.map(col => row[col.key] ?? '')),
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Download file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export data to PDF
 */
export function exportToPDF(options: ExportOptions): void {
    const { filename, title, subtitle, columns, data } = options;

    // Create PDF document (landscape for tables)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'letter',
    });

    // Add title
    if (title) {
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text(title, 14, 20);
    }

    // Add subtitle
    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(subtitle, 14, 28);
    }

    // Prepare table data
    const tableHeaders = columns.map(col => col.header);
    const tableData = data.map(row => columns.map(col => String(row[col.key] ?? '—')));

    // Generate table
    autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: title ? 35 : 20,
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [102, 126, 234], // Primary purple
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252], // Gray-50
        },
        columnStyles: columns.reduce((acc, col, index) => {
            if (col.width) {
                acc[index] = { cellWidth: col.width };
            }
            return acc;
        }, {} as Record<number, { cellWidth: number }>),
    });

    // Add footer with date
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Gray-400
        doc.text(
            `Generado: ${new Date().toLocaleDateString('es-ES')} | Página ${i} de ${pageCount}`,
            14,
            doc.internal.pageSize.height - 10
        );
    }

    // Download file
    doc.save(`${filename}.pdf`);
}

export default { exportToExcel, exportToPDF };
