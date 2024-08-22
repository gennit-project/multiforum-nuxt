
import { TagData } from './tagTypes'

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
