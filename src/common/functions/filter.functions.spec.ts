import * as TypeOrm from 'typeorm';

import { buildDateFilter } from './filter.functions';

describe('buildDateFilter', () => {
  const from = new Date('2024-01-01');
  const to = new Date('2024-01-31');

  it('should return a Between operator when both from and to dates are provided', () => {
    expect(buildDateFilter(from, to)).toEqual(
      TypeOrm.Between(expect.any(String), expect.any(String)),
    );
  });

  it('should return a LessThanOrEqual operator when only to date is provided', () => {
    expect(buildDateFilter(undefined, to)).toEqual(
      TypeOrm.LessThanOrEqual(expect.any(String)),
    );
  });

  it('should return a MoreThanOrEqual operator when only from date is provided', () => {
    expect(buildDateFilter(from, undefined)).toEqual(
      TypeOrm.MoreThanOrEqual(expect.any(String)),
    );
  });

  it('should return undefined when neither from nor to date is provided', () => {
    expect(buildDateFilter(undefined, undefined)).toBeUndefined();
  });
});
