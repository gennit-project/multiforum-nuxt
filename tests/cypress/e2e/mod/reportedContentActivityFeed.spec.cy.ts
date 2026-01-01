import { setupTestData } from '../../support/testSetup';

const BASE_URL = Cypress.env('baseUrl');
const GRAPHQL_URL = Cypress.env('graphqlUrl');
const OP_AUTH_USER = Cypress.env('auth0_username_2');
const OP_AUTH_PASSWORD = Cypress.env('auth0_password_2');

const OP_USERNAME = 'alice';
const MOD_USERNAME = 'cluse';
const DISCUSSION_CHANNEL = 'cats';
const EVENT_CHANNEL = 'phx_music';

const reportReasonText = 'Reported for testing';
const deleteReasonText = 'Removed for violating rules';

const loginAsOp = () => {
  cy.clearAllAuthState();
  cy.visit(`${BASE_URL}/discussions/`);
  cy.loginAsUser({ username: OP_AUTH_USER, password: OP_AUTH_PASSWORD });
  cy.window().then((win) => {
    const testWin = win as any;
    if (testWin.__SET_AUTH_STATE_DIRECT__) {
      testWin.__SET_AUTH_STATE_DIRECT__({
        username: OP_USERNAME,
        authenticated: true,
      });
    }
  });
  cy.wait(1000);
};

const loginAsMod = () => {
  cy.clearAllAuthState();
  cy.loginAsAdminWithUISync();
};

const graphqlAsCurrentUser = (
  query: string,
  variables: Record<string, any>
) => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    return cy
      .request({
        method: 'POST',
        url: GRAPHQL_URL,
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          query,
          variables,
        },
        failOnStatusCode: false,
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(
          response.body.errors,
          JSON.stringify(response.body.errors)
        ).to.equal(undefined);
        return response;
      });
  });
};

const CREATE_DISCUSSION = `
  mutation createDiscussion($input: [DiscussionCreateInputWithChannels!]!) {
    createDiscussionWithChannelConnections(input: $input) {
      id
      title
    }
  }
`;

const CREATE_EVENT = `
  mutation createEvent($input: [EventCreateInputWithChannels!]!) {
    createEventWithChannelConnections(input: $input) {
      id
      title
    }
  }
`;

const GET_DISCUSSION_CHANNEL = `
  query getDiscussionChannel($id: ID!, $channel: String!) {
    discussions(where: { id: $id }) {
      id
      DiscussionChannels(where: { channelUniqueName: $channel }) {
        id
      }
    }
  }
`;

const CREATE_COMMENT = `
  mutation createComment($input: [CommentCreateInput!]!) {
    createComments(input: $input) {
      comments {
        id
      }
    }
  }
`;

const REPORT_DISCUSSION = `
  mutation reportDiscussion(
    $discussionId: ID!
    $reportText: String!
    $selectedForumRules: [String!]!
    $selectedServerRules: [String!]!
    $channelUniqueName: String!
  ) {
    reportDiscussion(
      discussionId: $discussionId
      reportText: $reportText
      selectedForumRules: $selectedForumRules
      selectedServerRules: $selectedServerRules
      channelUniqueName: $channelUniqueName
    ) {
      id
      issueNumber
      isOpen
    }
  }
`;

const REPORT_COMMENT = `
  mutation reportComment(
    $commentId: ID!
    $reportText: String!
    $selectedForumRules: [String!]!
    $selectedServerRules: [String!]!
    $channelUniqueName: String!
  ) {
    reportComment(
      commentId: $commentId
      reportText: $reportText
      selectedForumRules: $selectedForumRules
      selectedServerRules: $selectedServerRules
      channelUniqueName: $channelUniqueName
    ) {
      id
      issueNumber
      isOpen
    }
  }
`;

const REPORT_EVENT = `
  mutation reportEvent(
    $eventId: ID!
    $reportText: String!
    $selectedForumRules: [String!]!
    $selectedServerRules: [String!]!
    $channelUniqueName: String!
  ) {
    reportEvent(
      eventId: $eventId
      reportText: $reportText
      selectedForumRules: $selectedForumRules
      selectedServerRules: $selectedServerRules
      channelUniqueName: $channelUniqueName
    ) {
      id
      issueNumber
      isOpen
    }
  }
`;

const UPDATE_DISCUSSION = `
  mutation updateDiscussion($id: ID!, $body: String!) {
    updateDiscussions(where: { id: $id }, update: { body: $body }) {
      discussions {
        id
      }
    }
  }
`;

const UPDATE_COMMENT = `
  mutation updateComment($id: ID!, $text: String!) {
    updateComments(where: { id: $id }, update: { text: $text }) {
      comments {
        id
      }
    }
  }
`;

const UPDATE_EVENT = `
  mutation updateEvent($id: ID!, $description: String!) {
    updateEvents(where: { id: $id }, update: { description: $description }) {
      events {
        id
      }
    }
  }
`;

const DELETE_DISCUSSION = `
  mutation deleteDiscussion($id: ID!) {
    deleteDiscussions(where: { id: $id }) {
      nodesDeleted
    }
  }
`;

const DELETE_COMMENT = `
  mutation deleteComment($id: ID!) {
    deleteComments(where: { id: $id }) {
      nodesDeleted
    }
  }
`;

const DELETE_EVENT = `
  mutation deleteEvent($id: ID!) {
    deleteEvents(where: { id: $id }) {
      nodesDeleted
    }
  }
`;

const ADD_DELETE_REASON = `
  mutation addDeleteReason(
    $issueId: ID!
    $actionDescription: String!
    $actionType: String!
    $displayName: String!
    $commentText: String!
    $channelUniqueName: String!
  ) {
    updateIssues(
      where: { id: $issueId }
      create: {
        ActivityFeed: [
          {
            node: {
              actionDescription: $actionDescription
              actionType: $actionType
              ModerationProfile: {
                connect: { where: { node: { displayName: $displayName } } }
              }
              Comment: {
                create: {
                  node: {
                    isRootComment: false
                    text: $commentText
                    Channel: {
                      connect: {
                        where: { node: { uniqueName: $channelUniqueName } }
                      }
                    }
                    Issue: { connect: { where: { node: { id: $issueId } } } }
                    CommentAuthor: {
                      ModerationProfile: {
                        connect: {
                          where: { node: { displayName: $displayName } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    ) {
      issues {
        id
        isOpen
      }
    }
  }
`;

const GET_ISSUE_FOR_DISCUSSION = `
  query getIssueForDiscussion($discussionId: ID!, $channelUniqueName: String!) {
    issues(
      where: {
        relatedDiscussionId: $discussionId
        channelUniqueName: $channelUniqueName
      }
    ) {
      id
      issueNumber
      isOpen
      ActivityFeed(options: { sort: { createdAt: DESC } }) {
        actionDescription
        actionType
        ModerationProfile {
          displayName
        }
        User {
          username
        }
        Comment {
          text
        }
      }
    }
  }
`;

const GET_ISSUE_FOR_COMMENT = `
  query getIssueForComment($commentId: ID!, $channelUniqueName: String!) {
    issues(
      where: {
        relatedCommentId: $commentId
        channelUniqueName: $channelUniqueName
      }
    ) {
      id
      issueNumber
      isOpen
      ActivityFeed(options: { sort: { createdAt: DESC } }) {
        actionDescription
        actionType
        ModerationProfile {
          displayName
        }
        User {
          username
        }
        Comment {
          text
        }
      }
    }
  }
`;

const GET_ISSUE_FOR_EVENT = `
  query getIssueForEvent($eventId: ID!, $channelUniqueName: String!) {
    issues(
      where: { relatedEventId: $eventId, channelUniqueName: $channelUniqueName }
    ) {
      id
      issueNumber
      isOpen
      ActivityFeed(options: { sort: { createdAt: DESC } }) {
        actionDescription
        actionType
        ModerationProfile {
          displayName
        }
        User {
          username
        }
        Comment {
          text
        }
      }
    }
  }
`;

const GET_ISSUE_BY_NUMBER = `
  query getIssueByNumber($channelUniqueName: String!, $issueNumber: Int!) {
    issues(
      where: { channelUniqueName: $channelUniqueName, issueNumber: $issueNumber }
    ) {
      id
      issueNumber
      isOpen
    }
  }
`;

const ISSUE_PAGE_REASON_ERROR = 'Please provide a reason before deleting.';
const ISSUE_CLOSED_REASON =
  'the issue was closed because the reported content was deleted';
const OP_LABEL = OP_USERNAME;

describe('Reported content activity feed updates', () => {
  setupTestData();

  const expectDeleteActivity = (input: {
    activityFeed: any[];
    actionDescription: string;
    expectedUser?: string | null;
    expectedMod?: string | null;
  }) => {
    const { activityFeed, actionDescription, expectedUser, expectedMod } =
      input;
    const deleteItems = activityFeed.filter(
      (item: any) => item.actionDescription === actionDescription
    );
    expect(deleteItems.length).to.be.greaterThan(0);
    const matched = deleteItems.some((item: any) => {
      const hasUser = expectedUser
        ? item.User?.username === expectedUser
        : !item.User?.username;
      const hasMod = expectedMod
        ? item.ModerationProfile?.displayName === expectedMod
        : !item.ModerationProfile?.displayName;
      return hasUser && hasMod;
    });
    expect(matched).to.eq(true);
  };

  const expectCloseReasonActivity = (activityFeed: any[]) => {
    expect(
      activityFeed.some(
        (item: any) => item.actionDescription === ISSUE_CLOSED_REASON
      )
    ).to.eq(true);
  };

  const createDiscussionAsOp = (title: string, body: string) => {
    return graphqlAsCurrentUser(CREATE_DISCUSSION, {
      input: [
        {
          discussionCreateInput: {
            title,
            body,
            hasDownload: false,
            Author: {
              connect: {
                where: {
                  node: {
                    username: OP_USERNAME,
                  },
                },
              },
            },
          },
          channelConnections: [DISCUSSION_CHANNEL],
        },
      ],
    }).then(
      (response) => response.body.data.createDiscussionWithChannelConnections[0]
    );
  };

  const createEventAsOp = (title: string, description: string) => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

    return graphqlAsCurrentUser(CREATE_EVENT, {
      input: [
        {
          eventCreateInput: {
            title,
            description,
            startTime,
            endTime,
            startTimeDayOfWeek: 'Monday',
            startTimeHourOfDay: 8,
            cost: '0',
            canceled: false,
            Poster: {
              connect: {
                where: {
                  node: {
                    username: OP_USERNAME,
                  },
                },
              },
            },
          },
          channelConnections: [EVENT_CHANNEL],
        },
      ],
    }).then(
      (response) => response.body.data.createEventWithChannelConnections[0]
    );
  };

  const createCommentAsOp = (
    discussionId: string,
    discussionChannelId: string
  ) => {
    return graphqlAsCurrentUser(CREATE_COMMENT, {
      input: [
        {
          text: 'OP comment text',
          isRootComment: true,
          CommentAuthor: {
            User: {
              connect: {
                where: {
                  node: {
                    username: OP_USERNAME,
                  },
                },
              },
            },
          },
          Channel: {
            connect: {
              where: {
                node: {
                  uniqueName: DISCUSSION_CHANNEL,
                },
              },
            },
          },
          DiscussionChannel: {
            connect: {
              where: {
                node: {
                  id: discussionChannelId,
                },
              },
            },
          },
        },
      ],
    }).then((response) => response.body.data.createComments.comments[0]);
  };

  const reportDiscussionAsMod = (discussionId: string) => {
    return graphqlAsCurrentUser(REPORT_DISCUSSION, {
      discussionId,
      reportText: reportReasonText,
      selectedForumRules: ['Rule A'],
      selectedServerRules: [],
      channelUniqueName: DISCUSSION_CHANNEL,
    }).then((response) => response.body.data.reportDiscussion);
  };

  const reportCommentAsMod = (commentId: string) => {
    return graphqlAsCurrentUser(REPORT_COMMENT, {
      commentId,
      reportText: reportReasonText,
      selectedForumRules: ['Rule A'],
      selectedServerRules: [],
      channelUniqueName: DISCUSSION_CHANNEL,
    }).then((response) => response.body.data.reportComment);
  };

  const reportEventAsMod = (eventId: string) => {
    return graphqlAsCurrentUser(REPORT_EVENT, {
      eventId,
      reportText: reportReasonText,
      selectedForumRules: ['Rule A'],
      selectedServerRules: [],
      channelUniqueName: EVENT_CHANNEL,
    }).then((response) => response.body.data.reportEvent);
  };

  it('updates issue activity feed for OP discussion edits and deletes', () => {
    loginAsOp();

    createDiscussionAsOp(
      `OP discussion ${Date.now()}`,
      'OP discussion body'
    ).then((discussion) => {
      const discussionId = discussion.id;

      loginAsMod();
      reportDiscussionAsMod(discussionId).then(() => {
        loginAsOp();

        graphqlAsCurrentUser(UPDATE_DISCUSSION, {
          id: discussionId,
          body: 'OP edited discussion body',
        }).then(() => {
          graphqlAsCurrentUser(GET_ISSUE_FOR_DISCUSSION, {
            discussionId,
            channelUniqueName: DISCUSSION_CHANNEL,
          }).then((response) => {
            const issue = response.body.data.issues[0];
            expect(
              issue.ActivityFeed.some(
                (item: any) =>
                  item.actionDescription === 'edited the discussion'
              )
            ).to.eq(true);
          });
        });

        graphqlAsCurrentUser(DELETE_DISCUSSION, {
          id: discussionId,
        }).then(() => {
          graphqlAsCurrentUser(GET_ISSUE_FOR_DISCUSSION, {
            discussionId,
            channelUniqueName: DISCUSSION_CHANNEL,
          }).then((response) => {
            const issue = response.body.data.issues[0];
            expect(issue.isOpen).to.eq(false);
            expectCloseReasonActivity(issue.ActivityFeed);
            expect(
              issue.ActivityFeed.some(
                (item: any) =>
                  item.actionDescription ===
                  `deleted the discussion by ${OP_LABEL}`
              )
            ).to.eq(true);
            expectDeleteActivity({
              activityFeed: issue.ActivityFeed,
              actionDescription: `deleted the discussion by ${OP_LABEL}`,
              expectedUser: OP_USERNAME,
              expectedMod: null,
            });
          });
        });
      });
    });
  });

  it('updates issue activity feed for mod discussion edits and deletes', () => {
    loginAsOp();

    createDiscussionAsOp(
      `Mod discussion ${Date.now()}`,
      'OP discussion body'
    ).then((discussion) => {
      const discussionId = discussion.id;

      loginAsMod();
      reportDiscussionAsMod(discussionId).then((issue) => {
        graphqlAsCurrentUser(UPDATE_DISCUSSION, {
          id: discussionId,
          body: 'Mod edited discussion body',
        }).then(() => {
          graphqlAsCurrentUser(GET_ISSUE_FOR_DISCUSSION, {
            discussionId,
            channelUniqueName: DISCUSSION_CHANNEL,
          }).then((response) => {
            const issueData = response.body.data.issues[0];
            expect(
              issueData.ActivityFeed.some(
                (item: any) =>
                  item.actionDescription === 'edited the discussion'
              )
            ).to.eq(true);
          });
        });

        graphqlAsCurrentUser(ADD_DELETE_REASON, {
          issueId: issue.id,
          actionDescription: 'deleted the discussion',
          actionType: 'delete',
          displayName: MOD_USERNAME,
          commentText: deleteReasonText,
          channelUniqueName: DISCUSSION_CHANNEL,
        }).then(() => {
          graphqlAsCurrentUser(DELETE_DISCUSSION, {
            id: discussionId,
          }).then(() => {
            graphqlAsCurrentUser(GET_ISSUE_FOR_DISCUSSION, {
              discussionId,
              channelUniqueName: DISCUSSION_CHANNEL,
            }).then((response) => {
              const issueData = response.body.data.issues[0];
              expect(issueData.isOpen).to.eq(false);
              expectCloseReasonActivity(issueData.ActivityFeed);
              const deleteItems = issueData.ActivityFeed.filter(
                (item: any) =>
                  item.actionDescription ===
                  `deleted the discussion by ${OP_LABEL}`
              );
              expect(deleteItems.length).to.eq(1);
              expect(
                deleteItems.some(
                  (item: any) => item.Comment?.text === deleteReasonText
                )
              ).to.eq(true);
              expectDeleteActivity({
                activityFeed: issueData.ActivityFeed,
                actionDescription: `deleted the discussion by ${OP_LABEL}`,
                expectedUser: null,
                expectedMod: MOD_USERNAME,
              });
            });
          });
        });
      });
    });
  });

  it('updates issue activity feed for OP comment edits and deletes', () => {
    loginAsOp();

    createDiscussionAsOp(
      `OP comment discussion ${Date.now()}`,
      'OP discussion body'
    ).then((discussion) => {
      const discussionId = discussion.id;

      graphqlAsCurrentUser(GET_DISCUSSION_CHANNEL, {
        id: discussionId,
        channel: DISCUSSION_CHANNEL,
      }).then((response) => {
        const discussionChannelId =
          response.body.data.discussions[0].DiscussionChannels[0].id;

        createCommentAsOp(discussionId, discussionChannelId).then((comment) => {
          const commentId = comment.id;

          loginAsMod();
          reportCommentAsMod(commentId).then(() => {
            loginAsOp();

            graphqlAsCurrentUser(UPDATE_COMMENT, {
              id: commentId,
              text: 'OP edited comment',
            }).then(() => {
              graphqlAsCurrentUser(GET_ISSUE_FOR_COMMENT, {
                commentId,
                channelUniqueName: DISCUSSION_CHANNEL,
              }).then((issueResponse) => {
                const issue = issueResponse.body.data.issues[0];
                expect(
                  issue.ActivityFeed.some(
                    (item: any) =>
                      item.actionDescription === 'edited the comment'
                  )
                ).to.eq(true);
              });
            });

            graphqlAsCurrentUser(DELETE_COMMENT, {
              id: commentId,
            }).then(() => {
              graphqlAsCurrentUser(GET_ISSUE_FOR_COMMENT, {
                commentId,
                channelUniqueName: DISCUSSION_CHANNEL,
              }).then((issueResponse) => {
                const issue = issueResponse.body.data.issues[0];
                expect(issue.isOpen).to.eq(false);
                expectCloseReasonActivity(issue.ActivityFeed);
                expect(
                  issue.ActivityFeed.some(
                    (item: any) =>
                      item.actionDescription ===
                      `deleted the comment by ${OP_LABEL}`
                  )
                ).to.eq(true);
                expectDeleteActivity({
                  activityFeed: issue.ActivityFeed,
                  actionDescription: `deleted the comment by ${OP_LABEL}`,
                  expectedUser: OP_USERNAME,
                  expectedMod: null,
                });
              });
            });
          });
        });
      });
    });
  });

  it('updates issue activity feed for mod comment edits and deletes', () => {
    loginAsOp();

    createDiscussionAsOp(
      `Mod comment discussion ${Date.now()}`,
      'OP discussion body'
    ).then((discussion) => {
      const discussionId = discussion.id;

      graphqlAsCurrentUser(GET_DISCUSSION_CHANNEL, {
        id: discussionId,
        channel: DISCUSSION_CHANNEL,
      }).then((response) => {
        const discussionChannelId =
          response.body.data.discussions[0].DiscussionChannels[0].id;

        createCommentAsOp(discussionId, discussionChannelId).then((comment) => {
          const commentId = comment.id;

          loginAsMod();
          reportCommentAsMod(commentId).then((issue) => {
            graphqlAsCurrentUser(UPDATE_COMMENT, {
              id: commentId,
              text: 'Mod edited comment',
            }).then(() => {
              graphqlAsCurrentUser(GET_ISSUE_FOR_COMMENT, {
                commentId,
                channelUniqueName: DISCUSSION_CHANNEL,
              }).then((issueResponse) => {
                const issueData = issueResponse.body.data.issues[0];
                expect(
                  issueData.ActivityFeed.some(
                    (item: any) =>
                      item.actionDescription === 'edited the comment'
                  )
                ).to.eq(true);
              });
            });

            graphqlAsCurrentUser(ADD_DELETE_REASON, {
              issueId: issue.id,
              actionDescription: 'deleted the comment',
              actionType: 'delete',
              displayName: MOD_USERNAME,
              commentText: deleteReasonText,
              channelUniqueName: DISCUSSION_CHANNEL,
            }).then(() => {
              graphqlAsCurrentUser(DELETE_COMMENT, {
                id: commentId,
              }).then(() => {
                graphqlAsCurrentUser(GET_ISSUE_FOR_COMMENT, {
                  commentId,
                  channelUniqueName: DISCUSSION_CHANNEL,
                }).then((issueResponse) => {
                  const issueData = issueResponse.body.data.issues[0];
                  expect(issueData.isOpen).to.eq(false);
                  expectCloseReasonActivity(issueData.ActivityFeed);
                  const deleteItems = issueData.ActivityFeed.filter(
                    (item: any) =>
                      item.actionDescription ===
                      `deleted the comment by ${OP_LABEL}`
                  );
                  expect(deleteItems.length).to.eq(1);
                  expect(
                    deleteItems.some(
                      (item: any) => item.Comment?.text === deleteReasonText
                    )
                  ).to.eq(true);
                  expectDeleteActivity({
                    activityFeed: issueData.ActivityFeed,
                    actionDescription: `deleted the comment by ${OP_LABEL}`,
                    expectedUser: null,
                    expectedMod: MOD_USERNAME,
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('updates issue activity feed for OP event edits and deletes', () => {
    loginAsOp();

    createEventAsOp(`OP event ${Date.now()}`, 'OP event description').then(
      (event) => {
        const eventId = event.id;

        loginAsMod();
        reportEventAsMod(eventId).then(() => {
          loginAsOp();

          graphqlAsCurrentUser(UPDATE_EVENT, {
            id: eventId,
            description: 'OP edited event',
          }).then(() => {
            graphqlAsCurrentUser(GET_ISSUE_FOR_EVENT, {
              eventId,
              channelUniqueName: EVENT_CHANNEL,
            }).then((issueResponse) => {
              const issue = issueResponse.body.data.issues[0];
              expect(
                issue.ActivityFeed.some(
                  (item: any) => item.actionDescription === 'edited the event'
                )
              ).to.eq(true);
            });
          });

          graphqlAsCurrentUser(DELETE_EVENT, {
            id: eventId,
          }).then(() => {
            graphqlAsCurrentUser(GET_ISSUE_FOR_EVENT, {
              eventId,
              channelUniqueName: EVENT_CHANNEL,
            }).then((issueResponse) => {
              const issue = issueResponse.body.data.issues[0];
              expect(issue.isOpen).to.eq(false);
              expectCloseReasonActivity(issue.ActivityFeed);
              expect(
                issue.ActivityFeed.some(
                  (item: any) =>
                    item.actionDescription ===
                    `deleted the event by ${OP_LABEL}`
                )
              ).to.eq(true);
              expectDeleteActivity({
                activityFeed: issue.ActivityFeed,
                actionDescription: `deleted the event by ${OP_LABEL}`,
                expectedUser: OP_USERNAME,
                expectedMod: null,
              });
            });
          });
        });
      }
    );
  });

  it('updates issue activity feed for mod event edits and deletes', () => {
    loginAsOp();

    createEventAsOp(`Mod event ${Date.now()}`, 'OP event description').then(
      (event) => {
        const eventId = event.id;

        loginAsMod();
        reportEventAsMod(eventId).then((issue) => {
          graphqlAsCurrentUser(UPDATE_EVENT, {
            id: eventId,
            description: 'Mod edited event',
          }).then(() => {
            graphqlAsCurrentUser(GET_ISSUE_FOR_EVENT, {
              eventId,
              channelUniqueName: EVENT_CHANNEL,
            }).then((issueResponse) => {
              const issueData = issueResponse.body.data.issues[0];
              expect(
                issueData.ActivityFeed.some(
                  (item: any) => item.actionDescription === 'edited the event'
                )
              ).to.eq(true);
            });
          });

          graphqlAsCurrentUser(ADD_DELETE_REASON, {
            issueId: issue.id,
            actionDescription: 'deleted the event',
            actionType: 'delete',
            displayName: MOD_USERNAME,
            commentText: deleteReasonText,
            channelUniqueName: EVENT_CHANNEL,
          }).then(() => {
            graphqlAsCurrentUser(DELETE_EVENT, {
              id: eventId,
            }).then(() => {
              graphqlAsCurrentUser(GET_ISSUE_FOR_EVENT, {
                eventId,
                channelUniqueName: EVENT_CHANNEL,
              }).then((issueResponse) => {
                const issueData = issueResponse.body.data.issues[0];
                expect(issueData.isOpen).to.eq(false);
                expectCloseReasonActivity(issueData.ActivityFeed);
                const deleteItems = issueData.ActivityFeed.filter(
                  (item: any) =>
                    item.actionDescription ===
                    `deleted the event by ${OP_LABEL}`
                );
                expect(deleteItems.length).to.eq(1);
                expect(
                  deleteItems.some(
                    (item: any) => item.Comment?.text === deleteReasonText
                  )
                ).to.eq(true);
                expectDeleteActivity({
                  activityFeed: issueData.ActivityFeed,
                  actionDescription: `deleted the event by ${OP_LABEL}`,
                  expectedUser: null,
                  expectedMod: MOD_USERNAME,
                });
              });
            });
          });
        });
      }
    );
  });

  it('requires a delete reason for non-OP via the issue page UI', () => {
    loginAsOp();

    createDiscussionAsOp(
      `OP delete UI ${Date.now()}`,
      'OP discussion body'
    ).then((discussion) => {
      const discussionId = discussion.id;

      loginAsMod();
      reportDiscussionAsMod(discussionId).then((issue) => {
        const issueNumber = issue.issueNumber;

        loginAsMod();
        cy.visit(
          `${BASE_URL}/forums/${DISCUSSION_CHANNEL}/issues/${issueNumber}`
        );

        cy.contains('Delete Discussion').should('be.visible').click();
        cy.get('button').contains('Delete').click();

        cy.contains(ISSUE_PAGE_REASON_ERROR).should('be.visible');
        cy.get('button').contains('Delete').click();
        cy.contains(ISSUE_PAGE_REASON_ERROR).should('be.visible');

        cy.get("textarea[data-testid='texteditor-textarea']")
          .first()
          .type(deleteReasonText);

        cy.contains('Delete Discussion').should('be.visible').click();
        cy.get('button').contains('Delete').click();

        graphqlAsCurrentUser(GET_ISSUE_BY_NUMBER, {
          channelUniqueName: DISCUSSION_CHANNEL,
          issueNumber,
        }).then((response) => {
          const issueData = response.body.data.issues[0];
          expect(issueData.isOpen).to.eq(false);
        });
      });
    });
  });
});
