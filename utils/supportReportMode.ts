export type SupportReportContent = {
  heading: string;
  intro: string;
  emailHelpText: string;
  subjectPlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  successTitle: string;
  successText: string;
};

const bugReportContent: SupportReportContent = {
  heading: 'Report a Bug',
  intro:
    "Found a bug or have feedback? Let us know! Please provide as much detail as possible, including screenshots if relevant. We'll get back to you at the email address you provide.",
  emailHelpText: "We'll use this email to respond to your bug report.",
  subjectPlaceholder: 'Brief description of the issue',
  descriptionLabel: 'Description *',
  descriptionPlaceholder:
    'Describe the bug in detail. Include steps to reproduce, expected behavior, actual behavior, and any other relevant information. You can attach screenshots by pasting or dropping them here.',
  successTitle: 'Bug report submitted successfully!',
  successText:
    "Thank you for your feedback. We'll review your report and get back to you soon.",
};

const contentReportContent: SupportReportContent = {
  heading: 'Report Harmful or Illegal Content',
  intro:
    'Use this form to report harmful or illegal content, even if you do not have an account. Include the URL and any context that will help us review it.',
  emailHelpText: "We'll use this email if we need more information.",
  subjectPlaceholder: 'Brief description of the content concern',
  descriptionLabel: 'Report Details *',
  descriptionPlaceholder:
    'Include the URL of the content, why you believe it is harmful or illegal, and any other relevant details.',
  successTitle: 'Content report submitted successfully!',
  successText:
    "Thank you for your report. We'll review it as soon as possible.",
};

export const getSupportReportContent = (
  reportType?: string | null
): SupportReportContent => {
  if (reportType === 'content-report') {
    return contentReportContent;
  }

  return bugReportContent;
};
