// Interface for Neo4j OGM Model with update method
interface OGMModel {
  update(params: {
    where: { username: string };
    update: {
      Notifications: Array<{
        create: Array<{
          node: {
            text: string;
            read: boolean;
          };
        }>;
      }>;
    };
  }): Promise<{ users?: unknown[] }>;
}

type CreateInAppNotificationInput = {
  UserModel: OGMModel;
  username: string;
  text: string;
};

export const createInAppNotification = async ({
  UserModel,
  username,
  text,
}: CreateInAppNotificationInput): Promise<boolean> => {
  try {
    const userUpdateResult = await UserModel.update({
      where: { username },
      update: {
        Notifications: [
          {
            create: [
              {
                node: {
                  text,
                  read: false,
                },
              },
            ],
          },
        ],
      },
    });

    return Boolean(userUpdateResult?.users?.length);
  } catch (error) {
    console.error('Error creating in-app notification:', error);
    return false;
  }
};
