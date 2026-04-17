import { NextResponse } from 'next/server';

import { getViewerNetworkPhaseSummary } from '@/lib/capture/viewer-network-phase';

export async function GET() {
  return NextResponse.json(getViewerNetworkPhaseSummary());
}
