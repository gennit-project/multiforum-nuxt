import type { ServerConfigCreateInput } from '../../../../../../__generated__/graphql';

const serverConfigs: ServerConfigCreateInput[] = [
  {
    serverName: 'Cypress Test Server',
    serverDescription:
      'Welcome to topical.space! This server exists for the purpose of development and testing Multiforum, an online forum and content aggregator with extra features that can be enabled for each forum, such as an event calendar, a wiki, and the ability to share downloads such as 3D printer files or video game mods (a feature still in development).',
    rules:
      '[{"summary":"Keep conversations respectful and constructive","detail":"- Critique ideas, actions, and policies respectfully, even when discussing public figures or controversial topics. Avoid using insults or inflammatory language.\\n- Ensure your contributions remain thoughtful and civil, even when addressing highly sensitive or contentious issues."},{"summary":"No NSFW content","detail":"- No explicit sexual or violent content\\n- No graphic imagery or gore\\n- No untagged sensitive content"},{"summary":"No illegal activity","detail":"- No content promoting illegal activities\\n- No discussion of planning illegal acts"},{"summary":"No sexual solicitation","detail":"- No using the platform for dating/hookups\\n- No age-inappropriate interactions"},{"summary":"No misinformation","detail":"- Spreading known false information\\n- Promoting conspiracy theories\\n- Content contradicting established scientific consensus"},{"summary":"No discriminatory content","detail":"No hate speech or discriminatory content based on:\\n\\n- Race or ethnicity\\n- Gender or sexual orientation\\n- Religion\\n- Any other protected characteristics"},{"summary":"No harassment","detail":"- Personal attacks, insults, or harassment of any individual\\n- No posting personally identifying information that could be used to harass an individual"}]',
    enableDownloads: true,
    enableEvents: true,
    allowedFileTypes: ['.zip', '.stl', '.glb', '.jpg', '.jpeg', '.png'],
  },
];
export default serverConfigs;
