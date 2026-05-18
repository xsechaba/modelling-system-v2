import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToS3 } from '@/lib/s3';
import { profileColumn } from '@/lib/profiler';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const projectId = formData.get('projectId') as string | null;
    const files: { name: string; size: number; columns: any[]; rowCount: number; sampleRows: any[]; s3Key?: string }[] = [];

    for (const [key, value] of Array.from(formData.entries())) {
      if (key === 'projectId') continue;
      if (typeof value === 'object' && value !== null && typeof (value as any).text === 'function') {
        const blob = value as Blob & { name: string; size: number };
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const text = buffer.toString('utf-8');
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = parsed.data as Record<string, string>[];
        const headers = parsed.meta.fields || [];

        const columns = headers.map(h => {
          const values = rows.map(r => r[h] ?? '');
          return profileColumn(h, values);
        });

        const sampleRows = rows.slice(0, 15).map(row => {
          const clean: Record<string, string> = {};
          for (const h of headers) {
            clean[h] = row[h] ?? '';
          }
          return clean;
        });

        let s3Key: string | undefined;
        if (projectId) {
          try {
            s3Key = await uploadToS3(projectId, blob.name, buffer, 'text/csv');
            await prisma.uploadedFile.upsert({
              where: { projectId_filename: { projectId, filename: blob.name } },
              create: { projectId, filename: blob.name, s3Key, fileType: 'text/csv', sizeBytes: blob.size },
              update: { s3Key, sizeBytes: blob.size },
            });
          } catch (s3Err) {
            console.warn('S3 upload failed (profiling will continue):', s3Err);
          }
        }

        files.push({ name: blob.name, size: blob.size, columns, rowCount: rows.length, sampleRows, s3Key });
      }
    }

    const callouts: { title: string; description: string; severity: 'warning' | 'success' | 'error' }[] = [];
    for (const file of files) {
      for (const col of file.columns) {
        if (col.missingPct > 5) {
          callouts.push({
            title: `Missing Values in \`${col.name}\``,
            description: `\`${col.name}\` is missing in ${col.missingPct}% of records. This may impact dimension linkage quality.`,
            severity: 'warning',
          });
        }
        if (col.type === 'date' && col.uniqueCount > 30) {
          callouts.push({
            title: 'Date Grain Detected',
            description: `\`${col.name}\` has ${col.uniqueCount} unique date values spanning ${col.dateMin} to ${col.dateMax}. Strong candidate for a time dimension.`,
            severity: 'success',
          });
        }
        if (col.flags?.some((f: any) => f.label === 'HAS NEGATIVES')) {
          callouts.push({
            title: `Negative Values in \`${col.name}\``,
            description: `\`${col.name}\` contains negative values (min: ${col.min}). This may indicate returns or adjustments in the raw data.`,
            severity: 'error',
          });
        }
        if (col.flags?.some((f: any) => f.label === 'OUTLIERS')) {
          callouts.push({
            title: `Outliers Detected in \`${col.name}\``,
            description: `\`${col.name}\` has a max value (${col.max}) more than 5× its mean (${col.mean}). Check for data entry errors or exceptional events.`,
            severity: 'warning',
          });
        }
        if (col.flags?.some((f: any) => f.label === 'HIGH CARDINALITY') && col.type === 'id') {
          callouts.push({
            title: `Surrogate Key Candidate: \`${col.name}\``,
            description: `\`${col.name}\` has ${col.uniqueDisplay} unique values with ${col.uniquePct}% uniqueness — strong primary key candidate.`,
            severity: 'success',
          });
        }
        if (col.type === 'numeric' && col.uniqueCount <= 10 && col.uniqueCount > 1) {
          callouts.push({
            title: `Low-Cardinality Numeric: \`${col.name}\``,
            description: `\`${col.name}\` is numeric but only has ${col.uniqueCount} distinct values — may be better modelled as a categorical attribute.`,
            severity: 'warning',
          });
        }
      }
    }
    // If no callouts were generated, add a quality pass notice
    if (callouts.length === 0 && files.length > 0) {
      callouts.push({
        title: 'Quality Checks Passed',
        description: `All columns passed basic quality checks. No missing values, outliers, or type anomalies detected across ${files.reduce((s, f) => s + f.columns.length, 0)} columns.`,
        severity: 'success',
      });
    }
    const sortedCallouts = callouts.sort((a, b) => {
      const order = { error: 0, warning: 1, success: 2 };
      return order[a.severity] - order[b.severity];
    }).slice(0, 3);

    return NextResponse.json({ files, callouts: sortedCallouts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
