export type SelectOptionData<T = string | number | boolean> = {
  label: string;
  value: T;
  event: string;
  icon: string;
};

export type MenuItem<T = string> = {
  label?: string;
  value?: T;
  event?: string;
  icon?: string;
  isDivider?: boolean;
};
