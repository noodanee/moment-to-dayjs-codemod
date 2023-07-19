// @ts-ignore
import { defineTest, defineInlineTest } from 'jscodeshift/dist/testUtils';
import transform from "../transform";

defineTest(__dirname, 'transform', null, 'assert', { parser: 'ts' });
defineTest(__dirname, 'transform', null, 'importBoth', { parser: 'ts' });
defineTest(__dirname, 'transform', null, 'require', { parser: 'ts' });
defineTest(__dirname, 'transform', null, 'transform', { parser: 'ts' });
defineTest(__dirname, 'transform', null, 'type', { parser: 'ts' });

describe('manipulation', () => {
  defineInlineTest(transform, null,
      `
      import moment from 'moment';
      moment().startOf('quarter');
      `,
      `
      import dayjs from 'dayjs';
      import quarterOfYear from 'dayjs/plugin/quarterOfYear';
      dayjs.extend(quarterOfYear);
      dayjs().startOf('quarter');
      `,
      'test startOf quarter import with plugin'
  );

  defineInlineTest(transform, null,
      `
      import moment from 'moment';
      moment().endOf('quarter');
      `,
      `
      import dayjs from 'dayjs';
      import quarterOfYear from 'dayjs/plugin/quarterOfYear';
      dayjs.extend(quarterOfYear);
      dayjs().endOf('quarter');
      `,
      'test endOf quarter import with plugin'
  );

  defineInlineTest(transform, null,
      `
      import moment from 'moment';
      moment().startOf('isoWeek');
      `,
      `
      import dayjs from 'dayjs';
      import isoWeek from 'dayjs/plugin/isoWeek';
      dayjs.extend(isoWeek);
      dayjs().startOf('isoWeek');
      `,
      'test startOf isoWeek import with plugin'
  );

  defineInlineTest(transform, null,
      `
      import moment from 'moment';
      moment().endOf('isoWeek');
      `,
      `
      import dayjs from 'dayjs';
      import isoWeek from 'dayjs/plugin/isoWeek';
      dayjs.extend(isoWeek);
      dayjs().endOf('isoWeek');
      `,
      'test endOf isoWeek import with plugin'
  );

});


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
  defineTest(__dirname, 'transform', null, 'plugins/updateLocale', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/utc', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/weekday', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/weekOfYear', { parser: 'ts' });
  defineTest(__dirname, 'transform', null, 'plugins/weekYear', { parser: 'ts' });
});
