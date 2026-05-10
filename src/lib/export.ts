import * as XLSX from 'xlsx';
import type { Deal } from '../types';

type ExportFormat = 'csv' | 'xlsx';

type ExportRow = {
  Name: string;
  Value: number;
  Stage: string;
  Period: string;
  Sector: string;
  Client: string;
  Tags: string;
  Notes: string;
  Owner: string;
};

const EXPORT_HEADERS: Array<keyof ExportRow> = [
  'Name',
  'Value',
  'Stage',
  'Period',
  'Sector',
  'Client',
  'Tags',
  'Notes',
  'Owner',
];

function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildExportRows(deals: Deal[]): ExportRow[] {
  return deals.map((deal: Deal) => ({
    Name: deal.name ?? '',
    Value: Number(deal.value) || 0,
    Stage: deal.stage ?? '',
    Period: deal.period ?? '',
    Sector: deal.sector ?? '',
    Client: deal.client?.name ?? '',
    Tags: deal.tags ?? '',
    Notes: deal.notes ?? '',
    Owner: deal.owner?.name ?? '',
  }));
}

function triggerDownload(content: Blob, filename: string): void {
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportDeals(deals: Deal[], format: ExportFormat): void {
  const rows = buildExportRows(deals);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: EXPORT_HEADERS });
  const filename = `hi-pipe-deals-${formatDateForFilename(new Date())}.${format}`;

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    triggerDownload(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }), filename);
    return;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Deals');
  XLSX.writeFile(workbook, filename);
}
