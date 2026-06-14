import { describe, expect, it } from 'vitest';
import { getSupportReportContent } from './supportReportMode';

describe('getSupportReportContent', () => {
  it.each([
    {
      reportType: 'content-report',
      expectedHeading: 'Report Harmful or Illegal Content',
    },
    {
      reportType: undefined,
      expectedHeading: 'Report a Bug',
    },
  ])(
    'returns the expected heading for $reportType',
    ({ reportType, expectedHeading }) => {
      expect(getSupportReportContent(reportType).heading).toBe(expectedHeading);
    }
  );
});
