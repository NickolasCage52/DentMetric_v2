import type { OrderDocument } from '@/types/orderDocument';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

const RUB = '\u20bd';

type PdfMakeInstance = {
  vfs?: unknown;
  createPdf: (def: unknown) => { download: (name: string) => void };
};

export async function generatePdf(doc: OrderDocument): Promise<void> {
  const pdfMakeMod = await import('pdfmake/build/pdfmake');
  const vfsMod = await import('pdfmake/build/vfs_fonts');

  const pdfMake = (pdfMakeMod as { default?: PdfMakeInstance }).default ?? (pdfMakeMod as unknown as PdfMakeInstance);
  const vfsRaw = (vfsMod as { default?: unknown }).default ?? vfsMod;
  const vfs =
    vfsRaw && typeof vfsRaw === 'object' && vfsRaw !== null && 'pdfMake' in vfsRaw
      ? (vfsRaw as { pdfMake?: { vfs?: unknown } }).pdfMake?.vfs
      : vfsRaw;

  pdfMake.vfs = vfs;

  const docDefinition = buildPdfDefinition(doc);
  const safeNum = doc.documentNumber.replace(/[^\w\-]+/g, '_');
  const filename = `${doc.documentTitle}_${safeNum}.pdf`;
  pdfMake.createPdf(docDefinition as unknown as TDocumentDefinitions).download(filename);
}

function buildPdfDefinition(doc: OrderDocument): Record<string, unknown> {
  const content: unknown[] = [];

  content.push({
    columns: [
      {
        stack: [
          { text: doc.service.name, style: 'serviceName' },
          doc.service.address ? { text: doc.service.address, style: 'serviceDetail' } : null,
          doc.service.phone ? { text: doc.service.phone, style: 'serviceDetail' } : null,
          doc.service.inn ? { text: `ИНН: ${doc.service.inn}`, style: 'serviceDetail' } : null,
        ].filter(Boolean),
        width: '*',
      },
      {
        stack: [
          { text: doc.documentTitle.toUpperCase(), style: 'docTitle' },
          { text: `\u2116 ${doc.documentNumber}`, style: 'docNum' },
          { text: `от ${doc.date}`, style: 'docNum' },
        ],
        width: 'auto',
        alignment: 'right',
      },
    ],
    margin: [0, 0, 0, 12],
  });

  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
    margin: [0, 0, 0, 10],
  });

  const vehicleLine = [doc.vehicle.brand, doc.vehicle.model].filter(Boolean).join(' ') || '\u2014';

  content.push({
    columns: [
      {
        stack: [
          { text: 'КЛИЕНТ', style: 'sectionTitle' },
          { text: `Имя: ${doc.client.name || '\u2014'}`, style: 'fieldText' },
          { text: `Тел: ${doc.client.phone || '\u2014'}`, style: 'fieldText' },
        ],
        width: '*',
      },
      {
        stack: [
          { text: '\u0410\u0412\u0422\u041e\u041c\u041e\u0411\u0418\u041b\u042c', style: 'sectionTitle' },
          { text: vehicleLine, style: 'fieldText' },
          { text: `Гос. номер: ${doc.vehicle.plate || '\u2014'}`, style: 'fieldText' },
          doc.vehicle.vin ? { text: `VIN: ${doc.vehicle.vin}`, style: 'fieldText' } : null,
        ].filter(Boolean),
        width: '*',
      },
    ],
    margin: [0, 0, 0, 12],
  });

  content.push({
    text: '\u041f\u0415\u0420\u0415\u0427\u0415\u041d\u042c \u0420\u0410\u0411\u041e\u0422',
    style: 'sectionTitle',
    margin: [0, 0, 0, 6],
  });

  const tableBody: unknown[][] = [
    [
      { text: '\u2116', style: 'tableHeader' },
      { text: 'Описание работы', style: 'tableHeader' },
      { text: 'Стоимость', style: 'tableHeader', alignment: 'right' },
    ],
    ...doc.dents.map((d) => [
      { text: String(d.number), style: 'tableCell' },
      {
        stack: [
          { text: d.element, style: 'tableCell' },
          { text: d.description, style: 'tableCellSmall' },
        ],
      },
      {
        text: `${d.price.toLocaleString('ru-RU')} ${RUB}`,
        style: 'tableCell',
        alignment: 'right',
      },
    ]),
    ...doc.additionalWorks.map((w) => [
      { text: '+', style: 'tableCell' },
      { text: w.name, style: 'tableCell' },
      {
        text: `${w.price.toLocaleString('ru-RU')} ${RUB}`,
        style: 'tableCell',
        alignment: 'right',
      },
    ]),
  ];

  content.push({
    table: {
      headerRows: 1,
      widths: [24, '*', 80],
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 12],
  });

  if (doc.discount) {
    content.push({
      text: `Скидка (${doc.discountPercent}%): \u2212${doc.discount.toLocaleString('ru-RU')} ${RUB}`,
      style: 'totalLine',
      alignment: 'right',
    });
  }
  content.push({
    text: `ИТОГО: ${doc.total.toLocaleString('ru-RU')} ${RUB}`,
    style: 'totalMain',
    alignment: 'right',
    margin: [0, 4, 0, 4],
  });
  if (doc.prepayment) {
    content.push({
      text: `Предоплата: ${doc.prepayment.toLocaleString('ru-RU')} ${RUB}`,
      style: 'totalLine',
      alignment: 'right',
    });
  }
  if (doc.balance !== undefined) {
    content.push({
      text: `К доплате: ${doc.balance.toLocaleString('ru-RU')} ${RUB}`,
      style: 'totalLine',
      alignment: 'right',
    });
  }

  if (doc.warrantyNote) {
    content.push({
      text: doc.warrantyNote,
      style: 'warrantyText',
      margin: [0, 10, 0, 0],
    });
  }

  content.push({
    columns: [
      {
        stack: [
          { text: 'Исполнитель', style: 'sigLabel' },
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 }],
            margin: [0, 20, 0, 4],
          },
          { text: doc.masterName || '', style: 'sigName' },
        ],
        width: '*',
      },
      {
        stack: [
          { text: 'Клиент', style: 'sigLabel' },
          doc.clientSignatureBase64
            ? { image: doc.clientSignatureBase64, width: 120, height: 40 }
            : {
                canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 }],
                margin: [0, 20, 0, 4],
              },
          doc.signedAt
            ? {
                text: new Date(doc.signedAt).toLocaleDateString('ru-RU'),
                style: 'sigName',
              }
            : { text: '', style: 'sigName' },
        ],
        width: '*',
      },
    ],
    margin: [0, 24, 0, 0],
  });

  if (doc.footerNote) {
    content.push({
      text: doc.footerNote,
      style: 'footerText',
      margin: [0, 12, 0, 0],
    });
  }

  return {
    content,
    styles: {
      serviceName: { fontSize: 12, bold: true },
      serviceDetail: { fontSize: 9, color: '#666666' },
      docTitle: { fontSize: 14, bold: true, color: '#1a1a1a' },
      docNum: { fontSize: 10, color: '#666666' },
      sectionTitle: { fontSize: 9, bold: true, color: '#888888' },
      fieldText: { fontSize: 10, margin: [0, 1, 0, 1] },
      tableHeader: { fontSize: 9, bold: true, color: '#888888' },
      tableCell: { fontSize: 10 },
      tableCellSmall: { fontSize: 9, color: '#888888' },
      totalLine: { fontSize: 11, color: '#444444' },
      totalMain: { fontSize: 14, bold: true },
      sigLabel: { fontSize: 9, color: '#888888' },
      sigName: { fontSize: 9, color: '#888888' },
      warrantyText: { fontSize: 9, color: '#888888', italics: true },
      footerText: { fontSize: 9, color: '#888888', alignment: 'center' },
    },
    defaultStyle: { font: 'Roboto', fontSize: 11 },
    pageMargins: [40, 40, 40, 40],
    pageSize: 'A4',
  };
}
