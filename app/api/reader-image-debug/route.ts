import { NextRequest, NextResponse } from 'next/server';

function isAllowedRemote(url: URL) {
  const hostname = url.hostname.toLowerCase();
  return (
    hostname === 'drm.cdn.nicomanga.jp' ||
    hostname === 'deliver.cdn.nicomanga.jp' ||
    hostname === 'sp.manga.nicovideo.jp' ||
    hostname === 'manga.nicovideo.jp'
  );
}

function detectMagic(bytes: Uint8Array) {
  const ascii = Array.from(bytes.slice(0, 16))
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('');

  const hex = Array.from(bytes.slice(0, 32))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');

  const isRiff = bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  const isPng = bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isGif = bytes.length >= 6 &&
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  const isHtml = ascii.toLowerCase().includes('<html') || ascii.toLowerCase().includes('<!doctype');
  const isJson = ascii.trim().startsWith('{') || ascii.trim().startsWith('[');

  return {
    ascii_head: ascii,
    hex_head: hex,
    looks_like_webp: isRiff,
    looks_like_png: isPng,
    looks_like_jpeg: isJpeg,
    looks_like_gif: isGif,
    looks_like_html: isHtml,
    looks_like_json: isJson,
  };
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('src');
  const referer = request.nextUrl.searchParams.get('referer') || 'https://sp.manga.nicovideo.jp/';

  if (!src) {
    return NextResponse.json({ error: 'Parâmetro src é obrigatório.' }, { status: 400 });
  }

  let remoteUrl: URL;
  try {
    remoteUrl = new URL(src);
  } catch {
    return NextResponse.json({ error: 'URL remota inválida.' }, { status: 400 });
  }

  if (!isAllowedRemote(remoteUrl)) {
    return NextResponse.json({ error: 'Host remoto não permitido.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(remoteUrl, {
      headers: {
        Referer: referer,
        Origin: 'https://sp.manga.nicovideo.jp',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      cache: 'no-store',
    });

    const contentType = upstream.headers.get('content-type');
    const contentLength = upstream.headers.get('content-length');
    const status = upstream.status;
    const statusText = upstream.statusText;
    const arrayBuffer = await upstream.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    return NextResponse.json({
      url: remoteUrl.toString(),
      status,
      statusText,
      contentType,
      contentLength,
      byteLength: bytes.length,
      magic: detectMagic(bytes),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro inesperado ao inspecionar imagem remota.',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
