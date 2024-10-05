export type ResultSetType = [string, number, boolean, boolean, number, number, string];

export interface NeoResponse {
  columns: string[];
  data: ResultSetType[];
}
