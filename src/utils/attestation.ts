import { AttestationType } from '../types/compliance';

/**
 * Get human-readable label for an attestation type
 */
export function getAttestationTypeLabel(type: AttestationType): string {
  const labels: Record<AttestationType, string> = {
    [AttestationType.KYC_AML]: 'KYC/AML Verification',
    [AttestationType.ACCREDITED_INVESTOR]: 'Accredited Investor',
    [AttestationType.JURISDICTION]: 'Jurisdiction Approval',
    [AttestationType.ISSUER_VERIFICATION]: 'Issuer Verification',
    [AttestationType.OTHER]: 'Other',
  };
  return labels[type] || type;
}
