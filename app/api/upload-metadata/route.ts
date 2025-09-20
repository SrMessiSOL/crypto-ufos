// pages/api/upload-metadata.ts
import { NextResponse } from 'next/server';
import PinataSDK from '@pinata/sdk';

const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_API_SECRET!,
});

export async function POST(request: Request) {
  const { metadata } = await request.json();
  if (!metadata) {
    return NextResponse.json({ error: 'Metadata is required' }, { status: 400 });
  }

  try {
    console.log('[upload-metadata] PINATA_API_KEY:', process.env.PINATA_API_KEY);
    console.log('[upload-metadata] PINATA_API_SECRET:', process.env.PINATA_API_SECRET);

    if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
      throw new Error('PINATA_API_KEY or PINATA_API_SECRET is not set in the environment variables.');
    }

    const Readable = require('stream').Readable;
    const metadataStream = new Readable();
    metadataStream.push(JSON.stringify(metadata));
    metadataStream.push(null);

    const options = {
      pinataMetadata: {
        name: 'metadata.json',
      },
      pinataOptions: {
        cidVersion: 0 as 0 | 1,
      },
    };
    const result = await pinata.pinFileToIPFS(metadataStream, options);

    const uri = `https://ipfs.io/ipfs/${result.IpfsHash}`;
    console.log('[upload-metadata] Upload successful:', uri);
    return NextResponse.json({ uri });
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error occurred during upload';
    console.error('[upload-metadata] Detailed Error:', {
      errorMessage,
      errorStack: error.stack,
      errorDetails: error,
    });
    return NextResponse.json({ error: `Failed to upload metadata: ${errorMessage}` }, { status: 500 });
  }
}