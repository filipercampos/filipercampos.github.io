export type DocKind = 'valid' | 'duplicate' | 'poison' | 'spoofed';

export type Stage = 'presign' | 's3' | 'sqs' | 'lambda' | 'dynamodb' | 'eventbridge' | 'dlq' | 'rejected';

export interface DocTrace {
  id: string;
  kind: DocKind;
  path: Stage[];
  status: 'PROCESSED' | 'DEDUPLICATED' | 'REJECTED' | 'DLQ';
  note: string;
}

const MAX_RECEIVES = 3;

/** Follows one upload through the pipeline, mirroring serverless-doc-pipeline behaviour. */
export function traceDocument(id: string, kind: DocKind, processed: Set<string>): DocTrace {
  const base: Stage[] = ['presign', 's3', 'sqs', 'lambda'];
  switch (kind) {
    case 'valid':
      processed.add(id);
      return {
        id,
        kind,
        path: [...base, 'dynamodb', 'eventbridge'],
        status: 'PROCESSED',
        note: 'Checksum + metadata stored, DocumentProcessed published once.',
      };
    case 'duplicate':
      if (processed.has(id)) {
        return {
          id,
          kind,
          path: [...base, 'dynamodb'],
          status: 'DEDUPLICATED',
          note: 'Same S3 event delivered again: Powertools idempotency record hit, no second event.',
        };
      }
      processed.add(id);
      return { id, kind, path: [...base, 'dynamodb', 'eventbridge'], status: 'PROCESSED', note: 'First delivery.' };
    case 'spoofed':
      return {
        id,
        kind,
        path: [...base, 'dynamodb', 'rejected'],
        status: 'REJECTED',
        note: 'Declared content type does not match magic bytes: marked REJECTED, not retried.',
      };
    case 'poison':
      return {
        id,
        kind,
        path: [...base, ...Array<Stage>(MAX_RECEIVES - 1).fill('lambda'), 'dlq'],
        status: 'DLQ',
        note: `Parser throws ${MAX_RECEIVES}x. Only this record is reported in batchItemFailures; the rest of the batch succeeds.`,
      };
  }
}
