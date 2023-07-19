// @ts-ignore
import { defineTest } from 'jscodeshift/dist/testUtils';

defineTest(__dirname, 'transform', null, 'assert', { parser: 'ts' });
defineTest(__dirname, 'transform', null, 'importBoth', { parser: 'ts' });
defineTest(__dirname, 'transform', null, 'require', { parser: 'ts' });
defineTest(__dirname, 'transform', null, 'transform', { parser: 'ts' });
defineTest(__dirname, 'transform', null, 'type', { parser: 'ts' });
describe('plugins', () => {
  defineTest(__dirname, 'transform', null, 'plugins/arraySupport', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/calendar', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/dayOfYear', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/duration', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/isBetween', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/isLeapYear', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/isoWeek', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/isoWeeksInYear', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/isSameOrAfter', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/isSameOrBefore', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/localeData', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/minMax', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/objectSupport', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/quarterOfYear', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/relativeTime', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/toArray', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/toObject', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/utc', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/weekday', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/weekOfYear', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/weekYear', { parser: 'ts' });
});
