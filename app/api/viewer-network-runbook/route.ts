import { NextResponse } from 'next/server';

import { getViewerNetworkRunbook } from '@/lib/capture/viewer-network-runbook';

export async function GET() {
  return NextResponse.json(getViewerNetworkRunbook());
}
