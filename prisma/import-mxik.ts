// One-off/occasional import of the national goods classifier (MXIK, from
// soliq.uz) into the MxikItem table. Not run automatically — the source CSV
// is large (300k+ rows) and only needs re-importing when the classifier
// itself is updated.
//
// Usage: DATABASE_URL=... npx tsx prisma/import-mxik.ts /path/to/mxik.csv
import "dotenv/config";
import fs from "node:fs";
import { parse } from "csv-parse";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx prisma/import-mxik.ts <path-to-csv>");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Row = {
  mxikCode: string;
  mxikName: string;
  groupName: string | null;
  className: string | null;
  positionName: string | null;
  subpositionName: string | null;
  brandName: string | null;
  attributeName: string | null;
  barcode: string | null;
  unit: string | null;
  packaging: string | null;
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function main() {
  const parser = fs.createReadStream(filePath).pipe(
    parse({ relax_column_count: true, skip_empty_lines: true })
  );

  let batch: Row[] = [];
  let rowIndex = 0;
  let imported = 0;
  const BATCH_SIZE = 2000;

  async function flush() {
    if (batch.length === 0) return;
    await prisma.mxikItem.createMany({ data: batch, skipDuplicates: true });
    imported += batch.length;
    process.stdout.write(`\rImported ~${imported} rows...`);
    batch = [];
  }

  for await (const record of parser as AsyncIterable<string[]>) {
    rowIndex += 1;
    if (rowIndex <= 2) continue; // two header rows

    const mxikCode = clean(record[6]);
    const mxikName = clean(record[7]);
    if (!mxikCode || !mxikName) continue;

    batch.push({
      groupName: clean(record[0]),
      className: clean(record[1]),
      positionName: clean(record[2]),
      subpositionName: clean(record[3]),
      brandName: clean(record[4]),
      attributeName: clean(record[5]),
      mxikCode,
      mxikName,
      barcode: clean(record[8]),
      unit: clean(record[10]) ?? clean(record[13]),
      packaging: clean(record[11]),
    });

    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  console.log(`\nDone. Imported ~${imported} MXIK items (from ${rowIndex} source rows).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
