import jsPDF from 'jspdf'
import type { InvoiceVariables } from './invoiceTemplate'

/**
 * Generate a professional PDF invoice from InvoiceVariables.
 * Returns a Blob that can be downloaded directly.
 */
export function generateInvoicePDF(vars: InvoiceVariables): Blob {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentW = pageW - margin * 2
    let y = margin

    // ── Colors ──
    const dark = '#1A1A1A'
    const gray = '#6B6B6B'
    const lightGray = '#E4E4E7'
    const lime = '#1A1A1A'

    // ── Helper: draw a horizontal line ──
    const drawLine = (yPos: number, color = lightGray) => {
        doc.setDrawColor(color)
        doc.setLineWidth(0.3)
        doc.line(margin, yPos, pageW - margin, yPos)
    }

    // ── Helper: add text and return new Y position ──
    const addText = (text: string, x: number, yPos: number, opts?: {
        size?: number, color?: string, bold?: boolean, align?: 'left' | 'right' | 'center', maxWidth?: number
    }) => {
        const size = opts?.size || 10
        const color = opts?.color || dark
        const bold = opts?.bold || false
        const align = opts?.align || 'left'
        doc.setFontSize(size)
        doc.setTextColor(color)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        if (opts?.maxWidth) {
            const lines = doc.splitTextToSize(text, opts.maxWidth)
            doc.text(lines, x, yPos, { align })
            return yPos + lines.length * (size * 0.4)
        }
        doc.text(text, x, yPos, { align })
        return yPos + size * 0.4
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // HEADER — Lime accent bar
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    doc.setFillColor(lime)
    doc.rect(0, 0, pageW, 4, 'F')

    // MOSH branding
    y = 18
    y = addText('MOSH', margin, y, { size: 22, bold: true, color: dark })
    y += 1
    y = addText(vars.MOSH_COMPANY_NAME, margin, y, { size: 8, color: gray })
    y = addText(vars.MOSH_ADDRESS, margin, y, { size: 8, color: gray })
    y = addText(`IDE : ${vars.MOSH_UID}`, margin, y, { size: 8, color: gray })

    // Invoice title — right aligned
    addText('FACTURE', pageW - margin, 18, { size: 28, bold: true, color: dark, align: 'right' })
    addText(vars.INVOICE_NUMBER, pageW - margin, 28, { size: 11, color: gray, align: 'right' })
    addText(`Date : ${vars.INVOICE_DATE}`, pageW - margin, 34, { size: 9, color: gray, align: 'right' })

    y += 4
    drawLine(y)
    y += 8

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PARTIES — Two columns
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const col1X = margin
    const col2X = pageW / 2 + 5

    let y1 = y
    y1 = addText('ÉMETTEUR', col1X, y1, { size: 7, color: gray, bold: true })
    y1 += 2
    y1 = addText(vars.MOSH_COMPANY_NAME, col1X, y1, { size: 10, bold: true })
    y1 = addText(vars.MOSH_ADDRESS, col1X, y1, { size: 9, color: gray, maxWidth: contentW / 2 - 5 })
    y1 += 1
    y1 = addText(vars.MOSH_EMAIL, col1X, y1, { size: 9, color: gray })

    let y2 = y
    y2 = addText('DESTINATAIRE', col2X, y2, { size: 7, color: gray, bold: true })
    y2 += 2
    y2 = addText(vars.CREATOR_FULL_NAME, col2X, y2, { size: 10, bold: true })
    y2 = addText(vars.CREATOR_ADDRESS, col2X, y2, { size: 9, color: gray, maxWidth: contentW / 2 - 5 })
    y2 += 1
    y2 = addText(vars.CREATOR_EMAIL, col2X, y2, { size: 9, color: gray })

    y = Math.max(y1, y2) + 8
    drawLine(y)
    y += 8

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MISSION DETAILS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    y = addText('DÉSIGNATION DE LA PRESTATION', margin, y, { size: 8, color: gray, bold: true })
    y += 4

    // Info grid
    const infoItems = [
        ['Mission', vars.MISSION_TITLE],
        ['Référence', vars.MISSION_REF],
        ['Client final', vars.BRAND_NAME],
        ['Date de livraison', vars.COMPLETION_DATE],
    ]

    for (const [label, value] of infoItems) {
        addText(`${label} :`, margin, y, { size: 9, color: gray })
        y = addText(value, margin + 40, y, { size: 9, bold: true })
        y += 1
    }

    y += 2
    // Deliverables
    const delivLines = vars.DELIVERABLES_SUMMARY.split('\n')
    for (const line of delivLines) {
        y = addText(line, margin, y, { size: 9, color: dark, maxWidth: contentW })
    }

    y += 6
    drawLine(y)
    y += 8

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FINANCIAL TABLE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    y = addText('DÉTAIL FINANCIER', margin, y, { size: 8, color: gray, bold: true })
    y += 5

    // Table background
    const tableY = y - 2
    doc.setFillColor('#FAFAFA')
    doc.roundedRect(margin, tableY, contentW, 32, 3, 3, 'F')

    // Row 1: HT
    addText('Montant HT', margin + 5, y, { size: 10, color: gray })
    y = addText(`CHF ${vars.AMOUNT_HT}`, pageW - margin - 5, y, { size: 10, align: 'right' })
    y += 2

    // Row 2: TVA
    addText(`TVA (${vars.TVA_RATE}%)`, margin + 5, y, { size: 10, color: gray })
    y = addText(`CHF ${vars.TVA_AMOUNT}`, pageW - margin - 5, y, { size: 10, align: 'right' })
    y += 3

    // Separator
    doc.setDrawColor('#C4C4C3')
    doc.setLineWidth(0.2)
    doc.line(margin + 5, y, pageW - margin - 5, y)
    y += 5

    // Row 3: Total
    addText('TOTAL TTC', margin + 5, y, { size: 12, bold: true, color: dark })
    y = addText(`CHF ${vars.AMOUNT_TTC}`, pageW - margin - 5, y, { size: 12, bold: true, align: 'right' })

    y += 10
    drawLine(y)
    y += 8

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PAYMENT TERMS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    y = addText('CONDITIONS DE PAIEMENT', margin, y, { size: 8, color: gray, bold: true })
    y += 4
    y = addText(vars.PAYMENT_TERMS, margin, y, { size: 9, color: dark })
    y += 1
    y = addText(`Échéance : ${vars.PAYMENT_DUE_DATE}`, margin, y, { size: 9, bold: true, color: dark })

    y += 10
    y = addText('Merci pour votre collaboration.', margin, y, { size: 10, color: gray })
    y += 2
    y = addText(vars.MOSH_COMPANY_NAME, margin, y, { size: 10, bold: true, color: dark })

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FOOTER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const footerY = doc.internal.pageSize.getHeight() - 10
    doc.setFillColor(lime)
    doc.rect(0, footerY - 2, pageW, 12, 'F')
    addText(
        `Facture générée automatiquement par la plateforme MOSH — ${vars.MOSH_COMPANY_NAME}`,
        pageW / 2, footerY + 2,
        { size: 7, color: dark, align: 'center' }
    )

    return doc.output('blob')
}
