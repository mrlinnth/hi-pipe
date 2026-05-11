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
    { name: 'Lead', slug: 'lead', color: '#F59E0B', sort_order: 1 },
    { name: 'Progress', slug: 'progress', color: '#3B82F6', sort_order: 2 },
    { name: 'Won', slug: 'won', color: '#10B981', sort_order: 4 },
    { name: 'Lost', slug: 'lost', color: '#EF4444', sort_order: 5 },
    { name: 'Pause', slug: 'pause', color: '#6B7280', sort_order: 3 },
  ],
  deals: [
    { name: 'MNHR php web app', value: 1000, stage: 'pause', period: 'Q1', sector: 'Government / NGO', notes: '', tags: 'amc' },
    { name: 'May Bank QR web app', value: 5000, stage: 'pause', period: 'Q1', sector: 'Banking', notes: '', tags: 'app' },
    { name: 'City Depot Loyalty App', value: 2000, stage: 'pause', period: 'Q1', sector: 'Manufacture / Retail', notes: '', tags: 'loyalty' },
    { name: 'Yar Kyaw Hospital App', value: 75000, stage: 'pause', period: 'Q2', sector: 'Insurance / Healthcare', notes: "QMS + Loyalty + Booking\n75000 quotation but project won't happen in 2025", tags: 'qms,loyalty' },
    { name: 'UniTV Streaming App', value: 15000, stage: 'progress', period: 'Q2', sector: 'Telecom / Infra / Media', notes: '', tags: 'app' },
    { name: 'Pun Hlaing QMS Kiosk', value: 2000, stage: 'pause', period: 'Q2', sector: 'Insurance / Healthcare', notes: '', tags: 'qms' },
    { name: 'Asia Royal LMS', value: 5000, stage: 'progress', period: 'Q2', sector: 'Insurance / Healthcare', notes: '', tags: 'lms' },
    { name: 'Lottery App', value: 0, stage: 'lost', period: 'Q2', sector: 'Other', notes: '', tags: 'app' },
    { name: 'Pan Pacific Loyalty', value: 2000, stage: 'pause', period: 'Q1', sector: 'Microfinance / Edu / Hotel', notes: '', tags: 'loyalty' },
    { name: 'FRS social sharing mobile app', value: 0, stage: 'pause', period: 'Q2', sector: 'Other', notes: '', tags: 'app' },
    { name: 'True Money Migration', value: 1000, stage: 'won', period: 'Q2', sector: 'Microfinance / Edu / Hotel', notes: '', tags: 'migration' },
    { name: 'Wathan Website', value: 1000, stage: 'progress', period: 'Q2', sector: 'Insurance / Healthcare', notes: '', tags: 'website,amc' },
    { name: 'IEMMyanmar website', value: 1000, stage: 'pause', period: 'Q2', sector: 'Manufacture / Retail', notes: '', tags: 'website,amc' },
    { name: 'Sanwaila Taxi Voucher App', value: 7000, stage: 'progress', period: 'Q2', sector: 'Other', notes: '', tags: 'app' },
    { name: 'iCar QMS', value: 12000, stage: 'progress', period: 'Q2', sector: 'Manufacture / Retail', notes: '', tags: 'qms' },
    { name: 'MM Invest UIUX', value: 2000, stage: 'pause', period: 'Q2', sector: 'Microfinance / Edu / Hotel', notes: '', tags: 'uiux' },
    { name: 'MM Golden Eagle Warehouse', value: 2900, stage: 'progress', period: 'Q2', sector: 'Manufacture / Retail', notes: '', tags: 'integration' },
    { name: 'Lan Pya Kyal Migration', value: 2000, stage: 'progress', period: 'Q2', sector: 'Government / NGO', notes: '', tags: 'migration' },
    { name: 'City Holding AMC', value: 1200, stage: 'progress', period: 'Q2', sector: 'Manufacture / Retail', notes: '', tags: 'amc' },
    { name: 'CIS 2 Market Fixed Asset System', value: 2900, stage: 'progress', period: 'Q2', sector: 'Manufacture / Retail', notes: '', tags: 'integration' },
    { name: 'Aryu Loyalty', value: 4000, stage: 'progress', period: 'Q2', sector: 'Insurance / Healthcare', notes: '', tags: 'loyalty' },
    { name: 'New Day eSport App', value: 21600, stage: 'pause', period: 'Q2', sector: 'Telecom / Infra / Media', notes: '', tags: 'app' },
    { name: 'Euro Style Website', value: 200, stage: 'won', period: 'Q1', sector: 'Manufacture / Retail', notes: '', tags: 'amc' },
    { name: 'NTR Laravel Test', value: 300, stage: 'won', period: 'Q1', sector: 'Manufacture / Retail', notes: '', tags: '' },
    { name: 'Safe Bridge App', value: 17500, stage: 'won', period: 'Q2', sector: 'Microfinance / Edu / Hotel', notes: '', tags: 'app' },
    { name: 'Pun Hlaing QMS AMC', value: 3000, stage: 'won', period: 'Q2', sector: 'Insurance / Healthcare', notes: '', tags: 'qms,amc' },
    { name: 'Treasury AMC', value: 380, stage: 'won', period: 'Q2', sector: 'Government / NGO', notes: '', tags: 'amc' },
    { name: 'MHAA Migration', value: 2000, stage: 'progress', period: 'Q2', sector: 'Government / NGO', notes: '', tags: 'migration' },
    { name: 'Jenergistic Alpha E-commerce website', value: 16000, stage: 'progress', period: 'Q2', sector: 'Manufacture / Retail', notes: 'Sqaureup payment gateway, ecommerce website + mobile app', tags: 'ecommerce' },
    { name: 'Aye Myitta Hospital Website and Carehub', value: 0, stage: 'lead', period: 'Q2', sector: 'Banking', notes: '', tags: 'qms,loyalty,website' },
    { name: 'Meoda call center CRM', value: 5000, stage: 'progress', period: 'Q2', sector: 'Manufacture / Retail', notes: 'Call center projects having issues managing collecting and managing call order data', tags: 'app' },
    { name: 'Golden Wax Loyalty and Website', value: 4000, stage: 'progress', period: 'Q2', sector: 'Manufacture / Retail', notes: 'Small website. Loyalty app for farmers', tags: 'loyalty,website' },
    { name: 'Cabin 88 POS', value: 0, stage: 'pause', period: 'Q2', sector: 'Other', notes: '', tags: '' },
    { name: 'SCH Award Management System', value: 10000, stage: 'progress', period: 'Q2', sector: 'Insurance / Healthcare', notes: '', tags: '' },
  ],
};

function readDotEnv(path) {
  try {
    return readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .reduce((acc, line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return acc;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) return acc;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (key) acc[key] = value;
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
  return { url: url.replace(/\/+$/, ''), key };
}

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function requestWithCurl(method, url, key, payload) {
  const args = ['-sS', '-X', method, url, '-H', `Api-Key: ${key}`, '-H', 'Content-Type: application/json'];

  if (payload !== undefined) {
    args.push('--data-binary', JSON.stringify(payload));
  }

  args.push('-w', '\n__HTTP_STATUS__:%{http_code}');

  const res = spawnSync('curl', args, { encoding: 'utf8' });

  if (res.error) throw res.error;
  if (typeof res.stdout !== 'string') throw new Error('No response body returned by curl.');

  const marker = '\n__HTTP_STATUS__:';
  const markerIndex = res.stdout.lastIndexOf(marker);
  if (markerIndex === -1) throw new Error(`Unexpected curl output: ${res.stdout}`);

  const body = res.stdout.slice(0, markerIndex);
  const statusText = res.stdout.slice(markerIndex + marker.length).trim();
  const status = Number(statusText);

  if (!Number.isFinite(status)) throw new Error(`Invalid HTTP status: ${statusText}`);
  if (res.status !== 0) throw new Error(res.stderr || `curl failed for ${url}`);
  if (status < 200 || status >= 300) throw new Error(`HTTP ${status}: ${body}`);

  return { status, body };
}

function fetchExisting(collection, url, key) {
  const result = requestWithCurl('GET', `${url}/content/items/${collection}?limit=200`, key);
  try {
    return JSON.parse(result.body);
  } catch {
    throw new Error(`Failed to parse ${collection} response: ${result.body}`);
  }
}

function printHelp() {
  console.log(`Usage:
  node scripts/migrate-prod-cockpit.mjs [--apply]

Default mode is dry-run. Reads .env for:
  COCKPIT_API_URL or VITE_COCKPIT_API_URL
  COCKPIT_API_KEY or VITE_COCKPIT_API_KEY

In dry-run mode, no network calls are made.
In apply mode, checks existing records first and skips if data already exists.`);
}

async function main() {
  const { apply, help } = parseArgs(process.argv.slice(2));
  if (help) { printHelp(); return; }

  if (!apply) {
    console.log('Dry run — no network calls will be made.');
    console.log(`Stages to write: ${SOURCE.stages.length}`);
    console.log(`Deals to write: ${SOURCE.deals.length}`);
    console.log(`Owner ID: ${OWNER_ID}`);
    console.log(`Period mapping: Q1 -> ${PERIOD_MAP.Q1}, Q2 -> ${PERIOD_MAP.Q2}`);
    console.log('\nRe-run with --apply to write to Cockpit.');
    return;
  }

  const { url, key } = getConfig();
  if (!url || !key) {
    throw new Error('Missing Cockpit API credentials. Set COCKPIT_API_URL and COCKPIT_API_KEY.');
  }

  console.log(`API URL: ${url}`);

  // ── Check existing records ──────────────────────────────────────────────

  console.log('\nChecking existing records...');

  const existingStages = fetchExisting('stages', url, key);
  console.log(`Found ${existingStages.length} existing stages.`);

  if (existingStages.length > 0) {
    console.log('Stages already exist — skipping stage migration.');
    console.log('Existing stages:', existingStages.map((s) => s.name).join(', '));
  }

  const existingDeals = fetchExisting('deals', url, key);
  console.log(`Found ${existingDeals.length} existing deals.`);

  if (existingDeals.length > 0) {
    console.log('Deals already exist — skipping deal migration.');
    console.log('If you want to re-migrate, delete all existing deals from Cockpit first.');
  }

  if (existingStages.length > 0 && existingDeals.length > 0) {
    console.log('\nBoth collections already have data. Nothing to do.');
    return;
  }

  // ── Write stages ────────────────────────────────────────────────────────

  if (existingStages.length === 0) {
    console.log(`\nWriting ${SOURCE.stages.length} stages...`);
    for (const [index, stage] of SOURCE.stages.entries()) {
      const payload = {
        data: {
          _state: 1,
          name: stage.name,
          slug: stage.slug,
          color: stage.color,
          sort_order: stage.sort_order,
        },
      };
      const label = `[${index + 1}/${SOURCE.stages.length}]`;
      console.log(`${label} Writing stage: ${stage.name}`);
      const result = requestWithCurl('POST', `${url}/content/item/stages`, key, payload);
      const created = JSON.parse(result.body);
      console.log(`${label} OK — _id: ${created._id}`);
    }
    console.log('Stages done.');
  }

  // ── Write deals ─────────────────────────────────────────────────────────

  if (existingDeals.length === 0) {
    console.log(`\nWriting ${SOURCE.deals.length} deals...`);
    for (const [index, deal] of SOURCE.deals.entries()) {
      const payload = {
        data: {
          _state: 1,
          name: deal.name,
          value: deal.value,
          stage: deal.stage,
          period: PERIOD_MAP[deal.period] ?? deal.period,
          sector: deal.sector,
          notes: deal.notes ?? '',
          tags: deal.tags ?? '',
          sort_order: null,
          client: {},
          owner: { _id: OWNER_ID, _model: 'users' },
        },
      };
      const label = `[${index + 1}/${SOURCE.deals.length}]`;
      console.log(`${label} Writing deal: ${deal.name}`);
      const result = requestWithCurl('POST', `${url}/content/item/deals`, key, payload);
      const created = JSON.parse(result.body);
      console.log(`${label} OK — _id: ${created._id}`);
    }
    console.log('Deals done.');
  }

  console.log('\nMigration complete.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
});
