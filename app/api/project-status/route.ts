import { NextResponse } from 'next/server';

import { getProjectStatusSummary } from '@/lib/project-status';

export async function GET() {
  return NextResponse.json(getProjectStatusSummary());
}
