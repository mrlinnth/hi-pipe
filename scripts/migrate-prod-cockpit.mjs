#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const OWNER_ID = '6a0087d93a92a881070864ef';
const PERIOD_MAP = {
  Q1: 'Q1 FY2026',
  Q2: 'Q2 FY2026',
};

const SOURCE = {
  stages: [
    {
      _id: '69d6fe10d025ed296301faa1',
      name: 'Lead',
      slug: 'lead',
      color: '#F59E0B',
      sort_order: 1,
    },
    {
      _id: '69d6fe25d025ed296301faa2',
      name: 'Progress',
      slug: 'progress',
      color: '#3B82F6',
      sort_order: 2,
    },
    {
      _id: '69d6fe38d025ed296301faa3',
      name: 'Won',
      slug: 'won',
      color: '#10B981',
      sort_order: 4,
    },
    {
      _id: '69d6fe51d025ed296301faa4',
      name: 'Lost',
      slug: 'lost',
      color: '#EF4444',
      sort_order: 5,
    },
    {
      _id: '69d6fe69d025ed296301faa5',
      name: 'Pause',
      slug: 'pause',
      color: '#6B7280',
      sort_order: 3,
    },
  ],
  deals: [
    {
      _id: '69d8bbb5ef055cf727054a20',
      name: 'MNHR php web app',
      value: 1000,
      stage: 'pause',
      period: 'Q1',
      sector: 'Government / NGO',
      notes: '',
      tags: 'amc',
      sort_order: null,
    },
    {
      _id: '69d8bc97ef055cf727054a21',
      name: 'May Bank QR web app',
      value: 5000,
      stage: 'pause',
      period: 'Q1',
      sector: 'Banking',
      notes: '',
      tags: 'app',
      sort_order: null,
    },
    {
      _id: '69d8bcf6ef055cf727054a22',
      name: 'City Depot Loyalty App',
      value: 2000,
      stage: 'pause',
      period: 'Q1',
      sector: 'Manufacture / Retail',
      notes: '',
      tags: 'loyalty',
      sort_order: null,
    },
    {
      _id: '69d8bd15ef055cf727054a23',
      name: 'Yar Kyaw Hospital App',
      value: 75000,
      stage: 'pause',
      period: 'Q2',
      sector: 'Insurance / Healthcare',
      notes: "QMS + Loyalty + Booking\n75000 quotation but project won't happen in 2025",
      tags: 'qms,loyalty',
      sort_order: null,
    },
    {
      _id: '69d8bd7cef055cf727054a24',
      name: 'UniTV Streaming App',
      value: 15000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Telecom / Infra / Media',
      notes: '',
      tags: 'app',
      sort_order: null,
    },
    {
      _id: '69d8bdb3ef055cf727054a25',
      name: 'Pun Hlaing QMS Kiosk',
      value: 2000,
      stage: 'pause',
      period: 'Q2',
      sector: 'Insurance / Healthcare',
      notes: '',
      tags: 'qms',
      sort_order: null,
    },
    {
      _id: '69d8bddeef055cf727054a26',
      name: 'Asia Royal LMS',
      value: 5000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Insurance / Healthcare',
      notes: '',
      tags: 'lms',
      sort_order: null,
    },
    {
      _id: '69d8be0fef055cf727054a27',
      name: 'Lottery App',
      value: 0,
      stage: 'lost',
      period: 'Q2',
      sector: 'Other',
      notes: '',
      tags: 'app',
      sort_order: null,
    },
    {
      _id: '69d8be46ef055cf727054a28',
      name: 'Pan Pacific Loyalty',
      value: 2000,
      stage: 'pause',
      period: 'Q1',
      sector: 'Microfinance / Edu / Hotel',
      notes: '',
      tags: 'loyalty',
      sort_order: null,
    },
    {
      _id: '69d8be6aef055cf727054a29',
      name: 'FRS social sharing mobile app',
      value: 0,
      stage: 'pause',
      period: 'Q2',
      sector: 'Other',
      notes: '',
      tags: 'app',
      sort_order: null,
    },
    {
      _id: '69d8be95ef055cf727054a2a',
      name: 'True Money Migration',
      value: 1000,
      stage: 'won',
      period: 'Q2',
      sector: 'Microfinance / Edu / Hotel',
      notes: '',
      tags: 'migration',
      sort_order: null,
    },
    {
      _id: '69d8beacef055cf727054a2b',
      name: 'Wathan Website',
      value: 1000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Insurance / Healthcare',
      notes: '',
      tags: 'website,amc',
      sort_order: null,
    },
    {
      _id: '69d8bec5ef055cf727054a2c',
      name: 'IEMMyanmar website',
      value: 1000,
      stage: 'pause',
      period: 'Q2',
      sector: 'Manufacture / Retail',
      notes: '',
      tags: 'website,amc',
      sort_order: null,
    },
    {
      _id: '69d8beeeef055cf727054a2d',
      name: 'Sanwaila Taxi Voucher App',
      value: 7000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Other',
      notes: '',
      tags: 'app',
      sort_order: null,
    },
    {
      _id: '69d8bf07ef055cf727054a2e',
      name: 'iCar QMS',
      value: 12000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Manufacture / Retail',
      notes: '',
      tags: 'qms',
      sort_order: null,
    },
    {
      _id: '69d8bf28ef055cf727054a2f',
      name: 'MM Invest UIUX',
      value: 2000,
      stage: 'pause',
      period: 'Q2',
      sector: 'Microfinance / Edu / Hotel',
      notes: '',
      tags: 'uiux',
      sort_order: null,
    },
    {
      _id: '69d8bf81ef055cf727054a30',
      name: 'MM Golden Eagle Warehouse',
      value: 2900,
      stage: 'progress',
      period: 'Q2',
      sector: 'Manufacture / Retail',
      notes: '',
      tags: 'integration',
      sort_order: null,
    },
    {
      _id: '69d8bfb8ef055cf727054a31',
      name: 'Lan Pya Kyal Migration',
      value: 2000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Government / NGO',
      notes: '',
      tags: 'migration',
      sort_order: null,
    },
    {
      _id: '69d8c045ef055cf727054a32',
      name: 'City Holding AMC',
      value: 1200,
      stage: 'progress',
      period: 'Q2',
      sector: 'Manufacture / Retail',
      notes: '',
      tags: 'amc',
      sort_order: null,
    },
    {
      _id: '69d8c073ef055cf727054a33',
      name: 'CIS 2 Market Fixed Asset System',
      value: 2900,
      stage: 'progress',
      period: 'Q2',
      sector: 'Manufacture / Retail',
      notes: '',
      tags: 'integration',
      sort_order: null,
    },
    {
      _id: '69d8c08bef055cf727054a34',
      name: 'Aryu Loyalty',
      value: 4000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Insurance / Healthcare',
      notes: '',
      tags: 'loyalty',
      sort_order: null,
    },
    {
      _id: '69d8c0a8ef055cf727054a35',
      name: 'New Day eSport App',
      value: 21600,
      stage: 'pause',
      period: 'Q2',
      sector: 'Telecom / Infra / Media',
      notes: '',
      tags: 'app',
      sort_order: null,
    },
    {
      _id: '69d8c0c6ef055cf727054a36',
      name: 'Euro Style Website',
      value: 200,
      stage: 'won',
      period: 'Q1',
      sector: 'Manufacture / Retail',
      notes: '',
      tags: 'amc',
      sort_order: null,
    },
    {
      _id: '69d8c0f3ef055cf727054a37',
      name: 'NTR Laravel Test',
      value: 300,
      stage: 'won',
      period: 'Q1',
      sector: 'Manufacture / Retail',
      notes: '',
      tags: '',
      sort_order: null,
    },
    {
      _id: '69d8c108ef055cf727054a38',
      name: 'Safe Bridge App',
      value: 17500,
      stage: 'won',
      period: 'Q2',
      sector: 'Microfinance / Edu / Hotel',
      notes: '',
      tags: 'app',
      sort_order: null,
    },
    {
      _id: '69d8c121ef055cf727054a39',
      name: 'Pun Hlaing QMS AMC',
      value: 3000,
      stage: 'won',
      period: 'Q2',
      sector: 'Insurance / Healthcare',
      notes: '',
      tags: 'qms,amc',
      sort_order: null,
    },
    {
      _id: '69d8c137ef055cf727054a3a',
      name: 'Treasury AMC',
      value: 380,
      stage: 'won',
      period: 'Q2',
      sector: 'Government / NGO',
      notes: '',
      tags: 'amc',
      sort_order: null,
    },
    {
      _id: '69d8c6c0ef055cf727054a3b',
      name: 'MHAA Migration',
      value: 2000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Government / NGO',
      notes: '',
      tags: 'migration',
      sort_order: null,
    },
    {
      _id: '69eec1eb53f7debaf30a2180',
      name: 'Jenergistic Alpha E-commerce website ',
      value: 16000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Manufacture / Retail',
      notes: 'Sqaureup payment gateway, ecommerce website + mobile app',
      tags: 'ecommerce',
      sort_order: null,
    },
    {
      _id: '69eec24a53f7debaf30a2181',
      name: 'Aye Myitta Hospital Website and Carehub',
      value: 0,
      stage: 'lead',
      period: 'Q2',
      sector: 'Banking',
      notes: '',
      tags: 'qms,loyalty,website',
      sort_order: null,
    },
    {
      _id: '69eec35e53f7debaf30a2182',
      name: 'Meoda call center CRM',
      value: 5000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Manufacture / Retail',
      notes: 'Call center projects having issues managing collecting and managing call order data ',
      tags: 'app',
      sort_order: null,
    },
    {
      _id: '69eec39653f7debaf30a2183',
      name: 'Golden Wax Loyalty and Website',
      value: 4000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Manufacture / Retail',
      notes: 'Small website. Loyalty app for farmers',
      tags: 'loyalty,website',
      sort_order: null,
    },
    {
      _id: '69f18406e1b0cce47004e0f0',
      name: 'Cabin 88 POS',
      value: 0,
      stage: 'pause',
      period: 'Q2',
      sector: 'Other',
      notes: '',
      tags: '',
      sort_order: null,
    },
    {
      _id: '69fe1456973e68f05307b200',
      name: 'SCH Award Management System ',
      value: 10000,
      stage: 'progress',
      period: 'Q2',
      sector: 'Insurance / Healthcare',
      notes: '',
      tags: '',
      sort_order: null,
    },
  ],
};

function readDotEnv(path) {
  try {
    return readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .reduce((acc, line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return acc;
        }
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) {
          return acc;
        }
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (key) {
          acc[key] = value;
        }
        return acc;
      }, {});
  } catch {
    return {};
  }
}

function getConfig() {
  const fileEnv = readDotEnv('.env');
  const mergedEnv = { ...fileEnv, ...process.env };
  const url = String(mergedEnv.COCKPIT_API_URL ?? mergedEnv.VITE_COCKPIT_API_URL ?? '').trim();
  const key = String(mergedEnv.COCKPIT_API_KEY ?? mergedEnv.VITE_COCKPIT_API_KEY ?? '').trim();
  return {
    url: url.replace(/\/+$/, ''),
    key,
  };
}

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function formatPayload(collection, item) {
  if (collection === 'stages') {
    return {
      _id: item._id,
      name: item.name,
      slug: item.slug,
      color: item.color,
      sort_order: item.sort_order,
    };
  }

  return {
    _id: item._id,
    name: item.name,
    value: item.value,
    stage: item.stage,
    period: PERIOD_MAP[item.period] ?? item.period,
    sector: '',
    notes: item.notes ?? '',
    tags: item.tags ?? '',
    sort_order: item.sort_order ?? null,
    owner: {
      _id: OWNER_ID,
      _model: 'users',
    },
  };
}

function requestWithCurl(url, key, payload) {
  const res = spawnSync(
    'curl',
    [
      '-sS',
      '-X',
      'POST',
      url,
      '-H',
      `Api-Key: ${key}`,
      '-H',
      'Content-Type: application/json',
      '--data-binary',
      JSON.stringify({ data: payload }),
      '-w',
      '\n__HTTP_STATUS__:%{http_code}',
    ],
    { encoding: 'utf8' },
  );

  if (res.error) {
    throw res.error;
  }

  if (typeof res.stdout !== 'string') {
    throw new Error('No response body returned by curl.');
  }

  const marker = '\n__HTTP_STATUS__:';
  const markerIndex = res.stdout.lastIndexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Unexpected curl output: ${res.stdout}`);
  }

  const body = res.stdout.slice(0, markerIndex);
  const statusText = res.stdout.slice(markerIndex + marker.length).trim();
  const status = Number(statusText);

  if (!Number.isFinite(status)) {
    throw new Error(`Invalid HTTP status returned by curl: ${statusText}`);
  }

  if (res.status !== 0) {
    throw new Error(res.stderr || `curl failed for ${url}`);
  }

  if (status < 200 || status >= 300) {
    throw new Error(`Cockpit request failed with HTTP ${status}: ${body}`);
  }

  return { status, body };
}

function printHelp() {
  console.log(`Usage:
  node scripts/migrate-prod-cockpit.mjs [--apply]

Default mode is dry-run. The script reads .env and/or environment variables:
  COCKPIT_API_URL or VITE_COCKPIT_API_URL
  COCKPIT_API_KEY or VITE_COCKPIT_API_KEY

In dry-run mode, no network calls are made.`);
}

function main() {
  const { apply, help } = parseArgs(process.argv.slice(2));
  if (help) {
    printHelp();
    return;
  }

  const stages = SOURCE.stages.map((stage) => formatPayload('stages', stage));
  const deals = SOURCE.deals.map((deal) => formatPayload('deals', deal));
  const operations = [
    ...stages.map((item) => ({ collection: 'stages', item })),
    ...deals.map((item) => ({ collection: 'deals', item })),
  ];

  console.log(`Prepared ${stages.length} stages and ${deals.length} deals.`);
  console.log(`Owner: ${OWNER_ID}`);
  console.log(`Period mapping: Q1 -> ${PERIOD_MAP.Q1}, Q2 -> ${PERIOD_MAP.Q2}`);
  console.log('Sector target: blank');

  if (!apply) {
    console.log('Dry run only. Re-run with --apply after setting Cockpit API credentials.');
    for (const op of operations) {
      const endpoint = `/content/item/${op.collection}`;
      console.log(`\n[DRY RUN] POST ${endpoint}`);
      console.log(JSON.stringify({ data: op.item }, null, 2));
    }
    return;
  }

  const { url, key } = getConfig();
  if (!url || !key) {
    throw new Error('Missing Cockpit API credentials. Set COCKPIT_API_URL and COCKPIT_API_KEY, or VITE_* equivalents.');
  }

  for (const [index, op] of operations.entries()) {
    const endpoint = `${url}/content/item/${op.collection}`;
    const label = `${index + 1}/${operations.length}`;
    console.log(`[${label}] Writing ${op.collection} ${op.item._id}...`);
    const result = requestWithCurl(endpoint, key, op.item);
    const preview = result.body.trim();
    console.log(`[${label}] OK ${preview ? preview.slice(0, 180) : '(empty response)'}`);
  }

  console.log(`Completed ${operations.length} Cockpit upserts.`);
}

main();
