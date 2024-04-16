import {
  Between,
  FindOperator,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { format } from 'date-fns';

function formatDateForFilter(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

export function buildDateFilter(from?: Date, to?: Date): FindOperator<any> {
  if (from && to) {
    return Between(formatDateForFilter(from), formatDateForFilter(to));
  } else if (from) {
    return MoreThanOrEqual(formatDateForFilter(from));
  } else if (to) {
    return LessThanOrEqual(formatDateForFilter(to));
  }
  return undefined;
}
