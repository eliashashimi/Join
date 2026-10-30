export interface SummaryStats {
  todo: number;
  done: number;
  urgent: number;
  medium: number;
  low: number;
  nextDeadline: string | null;
  inBoard: number;
  inProgress: number;
  awaitingFeedback: number;
}