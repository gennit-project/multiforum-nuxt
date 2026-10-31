import {
  GetOwnEmailNotificationCountDocument,
  GetEventDocument,
} from '../../__generated__/operations';
import { requestGraphql } from '../../server/utils/typed-graphql';
export async function checkServerGraphql() {
  const result = await requestGraphql(
    '/graphql',
    GetOwnEmailNotificationCountDocument,
    {}
  );
  // @ts-expect-error this selection does not contain a username
  void result.data?.getOwnEmail?.username;
  // @ts-expect-error missing required event variables
  void requestGraphql('/graphql', GetEventDocument, {});
  void requestGraphql('/graphql', GetEventDocument, {
    // @ts-expect-error route arrays cannot be event IDs
    id: ['event'],
    channelUniqueName: 'cats',
  });
  // @ts-expect-error GraphQL data may be null or absent
  void result.data.getOwnEmail;
}
