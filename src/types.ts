
export type Event = {
  id: number;
  title: String;
  start: String;
  end: String;
};

export type ValidationError = {
  code: string;
  field?: "title" | "start" | "end";
  message: string;
};

