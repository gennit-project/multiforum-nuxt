
import type { TagData } from './Tag'


export enum ActionType {
  Close = "close",
  Comment = "comment",
  Archive = "archive",
  Remove = "remove",
  Reopen = "reopen",
  Report = "report",
  Suspension = "suspension",
  Unarchive = "un-archive",
  Unsuspend = "unsuspend",
}

export type CreateEditCommentFormValues = {
  depth: number
  parentCommentId?: string
  text: string
  tags?: [TagData]
  isRootComment?: boolean
}

export type CreateReplyInputData = {
  parentCommentId: string
  text: string
  depth: number
}

export type DeleteCommentInputData = {
  parentCommentId: string
  commentId: string
  replyCount: number
}
