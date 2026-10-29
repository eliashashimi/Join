export interface SummaryStats {
  todo: number;
  done: number;
  urgent: number;
  nextDeadline: string | null;
  inBoard: number;
  inProgress: number;
  awaitingFeedback: number;
}