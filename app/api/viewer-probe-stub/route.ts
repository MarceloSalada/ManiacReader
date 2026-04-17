import { NextResponse } from 'next/server';

import { getViewerProbeStubReport } from '@/lib/capture/viewer-network-probe-stub';

export async function GET() {
  return NextResponse.json(getViewerProbeStubReport());
}
