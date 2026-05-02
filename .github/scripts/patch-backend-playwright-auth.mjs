import { readFileSync, writeFileSync } from 'node:fs';

const filePath = process.argv[2];

if (!filePath) {
  throw new Error('Expected backend file path argument');
}

const source = readFileSync(filePath, 'utf8');

if (source.includes('const isMockAuthEnabled = () =>')) {
  process.exit(0);
}

const typeMarker = `type CachedUserInfo = {\n  email: string | null;\n};\n`;
const helperBlock = `${typeMarker}\nconst isMockAuthEnabled = () =>\n  process.env.E2E_MOCK_AUTH === "true" ||\n  process.env.PLAYWRIGHT_MOCK_AUTH === "true";\n\nconst decodeMockTokenPayload = (token: string) => {\n  const decodedMock = jwt.decode(token);\n\n  if (!decodedMock || typeof decodedMock === "string") {\n    return { email: null, username: null };\n  }\n\n  return {\n    email:\n      typeof decodedMock.email === "string" ? decodedMock.email : null,\n    username:\n      typeof decodedMock.username === "string" ? decodedMock.username : null,\n  };\n};\n`;

let next = source.replace(typeMarker, helperBlock);

next = next.replace(
  `\n  if (!process.env.AUTH0_DOMAIN) {\n    throw new Error("AUTH0_DOMAIN environment variable is not defined.");\n  }\n`,
  '\n'
);

const tokenBlock = `  if (token) {\n    decoded = await new Promise((resolve, reject) => {`;
const replacementTokenBlock = `  if (token) {\n    if (isMockAuthEnabled()) {\n      const mockPayload = decodeMockTokenPayload(token);\n      email = mockPayload.email;\n      username = mockPayload.username;\n\n      if (!username && email) {\n        username = await getUserFromEmail(email, ogm.model("Email"));\n      }\n\n      if (username) {\n        modProfileName = await getModProfileNameFromUsername(username, ogm);\n      }\n    }\n\n    if (!username && !email) {\n      if (!process.env.AUTH0_DOMAIN) {\n        throw new Error("AUTH0_DOMAIN environment variable is not defined.");\n      }\n\n    decoded = await new Promise((resolve, reject) => {`;

next = next.replace(tokenBlock, replacementTokenBlock);

const tokenAudienceTail = `    if (username) {\n      modProfileName = await getModProfileNameFromUsername(username, ogm);\n    }\n  }\n\n  return {\n    username: username || null,\n    email,\n    email_verified: false,\n`;
const replacementTokenAudienceTail = `    if (username) {\n      modProfileName = await getModProfileNameFromUsername(username, ogm);\n    }\n    }\n  }\n\n  return {\n    username: username || null,\n    email,\n    email_verified: isMockAuthEnabled() ? true : false,\n`;

next = next.replace(tokenAudienceTail, replacementTokenAudienceTail);

if (next === source) {
  throw new Error('Backend auth patch did not modify the target file');
}

writeFileSync(filePath, next);
