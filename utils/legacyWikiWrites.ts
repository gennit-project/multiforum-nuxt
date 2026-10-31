// Narrow #700 exceptions until backend #413 exposes home-page and author inputs.
// These builders describe existing runtime payloads, not schema compatibility.
interface WikiCreateFields {
  title: string;
  body: string;
  editReason: string;
  slug: string;
}
interface WikiEditFields {
  title: string;
  body: string;
  editReason: string;
}
const authorConnection = (username: string) => ({
  connect: { where: { node: { username } } },
});
const createNode = (
  form: WikiCreateFields,
  channelUniqueName: string,
  username: string
) => ({
  title: form.title,
  body: form.body,
  editReason: form.editReason || undefined,
  slug: form.slug,
  channelUniqueName,
  VersionAuthor: authorConnection(username),
});
const updateNode = (form: WikiEditFields, username: string) => ({
  title: form.title,
  body: form.body,
  editReason: form.editReason || null,
  VersionAuthor: authorConnection(username),
});
export const legacyCreateWikiHomeVariables = (
  form: WikiCreateFields,
  forumId: string,
  username: string
) => ({
  where: { uniqueName: { eq: forumId } },
  update: {
    WikiHomePage: { create: { node: createNode(form, forumId, username) } },
  },
});
export const legacyCreateWikiChildVariables = (
  form: WikiCreateFields,
  forumId: string,
  username: string,
  parentId: string
) => ({
  where: { id: { eq: parentId } },
  update: {
    ChildPages: { create: [{ node: createNode(form, forumId, username) }] },
  },
});
export const legacyUpdateWikiHomeVariables = (
  form: WikiEditFields,
  forumId: string,
  username: string
) => ({
  where: { uniqueName: { eq: forumId } },
  update: { WikiHomePage: { update: { node: updateNode(form, username) } } },
});
export const legacyUpdateWikiPageVariables = (
  form: WikiEditFields,
  forumId: string,
  username: string,
  slug: string
) => ({
  where: { channelUniqueName: forumId, slug },
  update: updateNode(form, username),
});
