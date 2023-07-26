import jscodeshift from 'jscodeshift';
import * as prettier from 'prettier';
import transform from '../transform';

async function assertTransform(input: any, output: any) {
    const j = jscodeshift.withParser('ts');
    const result = await transform(
        {
            source: await prettier.format(input, {
                parser: 'typescript',
            }),
            path: '',
        },
        {
            jscodeshift: j,
            j,
            stats: () => {},
            report: () => {},
        }
    );

    return expect(
        await prettier.format(result, {
            parser: 'typescript',
        })
    ).toEqual(
        await prettier.format(output, {
            parser: 'typescript',
        })
    );
}

describe('assert', () => {
    it('test isMoment to isDayjs', async () => {
        await assertTransform(
            `
        import moment from 'moment';
        moment.isMoment(new Date());
        moment.isMoment(moment());
        `,
            `
        import dayjs from 'dayjs';
        dayjs.isDayjs(new Date());
        dayjs.isDayjs(dayjs());
        `
        );
    });
});

describe('import both', () => {
    it('test import both', async () => {
        await assertTransform(
            `
        import dayjs from 'dayjs';
        import moment from 'moment';
        dayjs('2021-01-01').toDate();
        moment('2021-01-01').toDate();
        `,
            `
        import dayjs from 'dayjs';
        dayjs('2021-01-01').toDate();
        dayjs('2021-01-01').toDate();
        `
        );
    });

    it('test require both', async () => {
        await assertTransform(
            `
        const dayjs = require('dayjs');
        const moment = require('moment');
        dayjs('2021-01-01').toDate();
        moment('2021-01-01').toDate();
        `,
            `
        const dayjs = require('dayjs');
        dayjs('2021-01-01').toDate();
        dayjs('2021-01-01').toDate();
        `
        );
    });
});

describe('require', () => {
    it('test require statement', async () => {
        await assertTransform(
            `
        const moment = require('moment');
        moment();
        `,
            `
        const dayjs = require('dayjs');
        dayjs();
        `
        );
    });

    it('test require statement load plugin', async () => {
        await assertTransform(
            `
        const moment = require('moment');
        moment([2010]);
        `,
            `
        const dayjs = require('dayjs');
        const arraySupport = require('dayjs/plugin/arraySupport');
        dayjs.extend(arraySupport);
        dayjs([2010]);
        `
        );
    });
});

describe('transform', () => {
    it('test transform', async () => {
        await assertTransform(
            `
        import moment from 'moment';
        // parameters
        moment().add(1, 'day').toDate();
        moment().add(1, 'days').toDate();
        const days = 1;
        moment().add(days, 'day').toDate();

        // get
        moment().year();
        moment().month();
        moment().day();
        moment().hour();
        moment().minute();
        moment().second();

        // get - plural
        moment().years();
        moment().months();
        moment().days();
        moment().hours();
        moment().minutes();
        moment().seconds();

        // set
        moment().set('day', 1);
        moment().set('days', 1);

        // units
        moment().add(1, 'year').toDate();
        moment().add(1, 'years').toDate();
        moment().add(1, 'month').toDate();
        moment().add(1, 'months').toDate();
        moment().add(1, 'week').toDate();
        moment().add(1, 'weeks').toDate();
        moment().add(1, 'day').toDate();
        moment().add(1, 'days').toDate();
        moment().add(1, 'hour').toDate();
        moment().add(1, 'hours').toDate();
        moment().add(1, 'minute').toDate();
        moment().add(1, 'minutes').toDate();
        moment().add(1, 'second').toDate();
        moment().add(1, 'seconds').toDate();
        moment().add(1, 'quarters').toDate();
        `,
            `
        import dayjs from 'dayjs';
        // parameters
        dayjs().add(1, 'day').toDate();
        dayjs().add(1, 'day').toDate();
        const days = 1;
        dayjs().add(days, 'day').toDate();

        // get
        dayjs().year();
        dayjs().month();
        dayjs().day();
        dayjs().hour();
        dayjs().minute();
        dayjs().second();

        // get - plural
        dayjs().year();
        dayjs().month();
        dayjs().day();
        dayjs().hour();
        dayjs().minute();
        dayjs().second();

        // set
        dayjs().day(1);
        dayjs().day(1);

        // units
        dayjs().add(1, 'year').toDate();
        dayjs().add(1, 'year').toDate();
        dayjs().add(1, 'month').toDate();
        dayjs().add(1, 'month').toDate();
        dayjs().add(1, 'week').toDate();
        dayjs().add(1, 'week').toDate();
        dayjs().add(1, 'day').toDate();
        dayjs().add(1, 'day').toDate();
        dayjs().add(1, 'hour').toDate();
        dayjs().add(1, 'hour').toDate();
        dayjs().add(1, 'minute').toDate();
        dayjs().add(1, 'minute').toDate();
        dayjs().add(1, 'second').toDate();
        dayjs().add(1, 'second').toDate();
        dayjs().add(1, 'quarter').toDate();
        `
        );
    });
});

describe('type', () => {
    it('test moment type to dayjs type', async () => {
        await assertTransform(
            `
        import moment, { Moment, MomentInput } from 'moment';
        const d: MomentInput = moment().add(1, 'day');
        const d2: moment.MomentInput = moment().add(1, 'day');
        const d3: Moment = moment().add(1, 'day');
        const d4: moment.Moment = moment().add(1, 'day');
        `,
            `
        import dayjs from 'dayjs';
        const d: dayjs.Dayjs = dayjs().add(1, 'day');
        const d2: dayjs.Dayjs = dayjs().add(1, 'day');
        const d3: dayjs.Dayjs = dayjs().add(1, 'day');
        const d4: dayjs.Dayjs = dayjs().add(1, 'day');
        `
        );
    });
});

describe('manipulation', () => {
    it('test startOf quarter import with plugin', async () => {
        await assertTransform(
            `
        import moment from 'moment';
        moment().startOf('quarter');
        `,
            `
        import dayjs from 'dayjs';
        import quarterOfYear from 'dayjs/plugin/quarterOfYear';
        dayjs.extend(quarterOfYear);
        dayjs().startOf('quarter');
        `
        );
    });

    it('test endOf quarter import with plugin', async () => {
        await assertTransform(
            `
        import moment from 'moment';
        moment().endOf('quarter');
        `,
            `
        import dayjs from 'dayjs';
        import quarterOfYear from 'dayjs/plugin/quarterOfYear';
        dayjs.extend(quarterOfYear);
        dayjs().endOf('quarter');
        `
        );
    });

    it('test startOf isoWeek import with plugin', async () => {
        await assertTransform(
            `
        import moment from 'moment';
        moment().startOf('isoWeek');
        `,
            `
        import dayjs from 'dayjs';
        import isoWeek from 'dayjs/plugin/isoWeek';
        dayjs.extend(isoWeek);
        dayjs().startOf('isoWeek');
        `
        );
    });

    it('test endOf isoWeek import with plugin', async () => {
        await assertTransform(
            `
        import moment from 'moment';
        moment().endOf('isoWeek');
        `,
            `
        import dayjs from 'dayjs';
        import isoWeek from 'dayjs/plugin/isoWeek';
        dayjs.extend(isoWeek);
        dayjs().endOf('isoWeek');
        `
        );
    });
});

describe('now', () => {
    it('test now', async () => {
        await assertTransform(
            `
        import moment from 'moment';
        moment.now();
        `,
            `
        import dayjs from 'dayjs';
        dayjs().valueOf();
        `
        );
    });
});

describe('i18n', () => {
    it('test esm locale', async () => {
        await assertTransform(
            `
        import moment from 'moment';
        moment.locale('zh-CN');
        `,
            `
        import dayjs from 'dayjs';
        import 'dayjs/locale/zh-cn';
        dayjs.locale('zh-cn');
        `
        );
    });

    it('test cjs locale', async () => {
        await assertTransform(
            `
        const moment = require('moment');
        moment.locale('zh-CN');
        `,
            `
        const dayjs = require('dayjs');
        require('dayjs/locale/zh-cn');
        dayjs.locale('zh-cn');
        `
        );
    });
});

describe('plugins', () => {
    describe('arraySupport', () => {
        it('test arraySupport plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment([2010, 1, 14, 15, 25, 50, 125]);
            `,
                `
            import dayjs from 'dayjs';
            import arraySupport from 'dayjs/plugin/arraySupport';
            dayjs.extend(arraySupport);
            dayjs([2010, 1, 14, 15, 25, 50, 125]);
            `
            );
        });
    });

    describe('calendar', () => {
        it('test calendar plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().calendar();
            `,
                `
            import dayjs from 'dayjs';
            import calendar from 'dayjs/plugin/calendar';
            dayjs.extend(calendar);
            dayjs().calendar();
            `
            );
        });
    });

    describe('dayOfYear', () => {
        it('test dayOfYear plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().dayOfYear(1);
            moment().dayOfYear();
            `,
                `
            import dayjs from 'dayjs';
            import dayOfYear from 'dayjs/plugin/dayOfYear';
            dayjs.extend(dayOfYear);
            dayjs().dayOfYear(1);
            dayjs().dayOfYear();
            `
            );
        });
    });

    describe('duration', () => {
        it('test duration plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment.duration(100);
            moment.duration(100).humanize();
            `,
                `
            import dayjs from 'dayjs';
            import duration from 'dayjs/plugin/duration';
            dayjs.extend(duration);
            import relativeTime from 'dayjs/plugin/relativeTime';
            dayjs.extend(relativeTime);
            dayjs.duration(100);
            dayjs.duration(100).humanize();
            `
            );
        });
    });

    describe('isBetween', () => {
        it('test isBetween plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment('2010-10-20').isBetween('2010-10-19', moment('2010-10-25'), 'year');
            moment('2016-10-30').isBetween('2016-01-01', '2016-10-30', null, '[)');
            `,
                `
            import dayjs from 'dayjs';
            import isBetween from 'dayjs/plugin/isBetween';
            dayjs.extend(isBetween);
            dayjs('2010-10-20').isBetween('2010-10-19', dayjs('2010-10-25'), 'year');
            dayjs('2016-10-30').isBetween('2016-01-01', '2016-10-30', null, '[)');
            `
            );
        });
    });

    describe('isLeapYear', () => {
        it('test isLeapYear plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().isLeapYear();
            `,
                `
            import dayjs from 'dayjs';
            import isLeapYear from 'dayjs/plugin/isLeapYear';
            dayjs.extend(isLeapYear);
            dayjs().isLeapYear();
            `
            );
        });
    });

    describe('isSameOrAfter', () => {
        it('test isSameOrAfter plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment('2010-10-20').isSameOrAfter('2010-10-19', 'year');
            moment('2010-10-20').isSameOrAfter('2010-10-19', 'years');
            `,
                `
            import dayjs from 'dayjs';
            import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
            dayjs.extend(isSameOrAfter);
            dayjs('2010-10-20').isSameOrAfter('2010-10-19', 'year');
            dayjs('2010-10-20').isSameOrAfter('2010-10-19', 'year');
            `
            );
        });
    });

    describe('isSameOrBefore', () => {
        it('test isSameOrBefore plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment('2010-10-20').isSameOrBefore('2010-10-19', 'year');
            moment('2010-10-20').isSameOrBefore('2010-10-19', 'years');
            `,
                `
            import dayjs from 'dayjs';
            import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
            dayjs.extend(isSameOrBefore);
            dayjs('2010-10-20').isSameOrBefore('2010-10-19', 'year');
            dayjs('2010-10-20').isSameOrBefore('2010-10-19', 'year');
            `
            );
        });
    });

    describe('isoWeek', () => {
        it('test isoWeek plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().isoWeek();
            moment().isoWeekday();
            moment().isoWeekYear();
            `,
                `
            import dayjs from 'dayjs';
            import isoWeek from 'dayjs/plugin/isoWeek';
            dayjs.extend(isoWeek);
            dayjs().isoWeek();
            dayjs().isoWeekday();
            dayjs().isoWeekYear();
            `
            );
        });
    });

    describe('isoWeeksInYear', () => {
        it('test isoWeeksInYear plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().isoWeeksInYear();
            `,
                `
            import dayjs from 'dayjs';
            import isLeapYear from 'dayjs/plugin/isLeapYear';
            dayjs.extend(isLeapYear);
            import isoWeeksInYear from 'dayjs/plugin/isoWeeksInYear';
            dayjs.extend(isoWeeksInYear);
            dayjs().isoWeeksInYear();
            `
            );
        });
    });

    describe('localeData', () => {
        it('test localeData plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().localeData();
            `,
                `
            import dayjs from 'dayjs';
            import localeData from 'dayjs/plugin/localeData';
            dayjs.extend(localeData);
            dayjs().localeData();
            `
            );
        });
    });

    describe('minMax', () => {
        it('test minMax plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment.max(moment(), moment('2018-01-01'), moment('2019-01-01'));
            moment.min([moment(), moment('2018-01-01'), moment('2019-01-01')]);
            `,
                `
            import dayjs from 'dayjs';
            import minMax from 'dayjs/plugin/minMax';
            dayjs.extend(minMax);
            dayjs.max(dayjs(), dayjs('2018-01-01'), dayjs('2019-01-01'));
            dayjs.min([dayjs(), dayjs('2018-01-01'), dayjs('2019-01-01')]);
            `
            );
        });

        it('test Math property do not load plugins', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            Math.min(moment('2018-01-01'), moment('2019-01-01'));
            Math.max(moment('2018-01-01'), moment('2019-01-01'));
            `,
                `
            import dayjs from 'dayjs';
            Math.min(dayjs('2018-01-01'), dayjs('2019-01-01'));
            Math.max(dayjs('2018-01-01'), dayjs('2019-01-01'));
            `
            );
        });
    });

    describe('objectSupport', () => {
        it('test objectSupport plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment({ year: 2010, month: 1, day: 12, });
            moment().set({ day: 1, });
            moment().set({ days: 1, });
            moment().set({ years: 2010, months: 1, days: 12, });
            const num = 1;
            moment().set({ day: num, });
            const days = 1;
            moment().set({ days, });
            moment().add({ day: 1, });
            moment().add({ days: 1, });
            `,
                `
            import dayjs from 'dayjs';
            import objectSupport from 'dayjs/plugin/objectSupport';
            dayjs.extend(objectSupport);
            dayjs({ 
                year: 2010, 
                month: 1, 
                day: 12,
             });
            dayjs().set({ 
                day: 1, 
            });
            dayjs().set({ 
                day: 1, 
            });
            dayjs().set({ 
                year: 2010, 
                month: 1, 
                day: 12, 
            });
            const num = 1;
            dayjs().set({ 
                day: num, 
            });
            const days = 1;
            dayjs().set({ 
                day: days, 
            });
            dayjs().add({ 
                day: 1, 
            });
            dayjs().add({ 
                day: 1, 
            });
            `
            );
        });
    });

    describe('quarterOfYear', () => {
        it('test quarterOfYear plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().quarter();
            moment().quarter(1);
            moment().quarters();
            moment().quarters(1);
            moment('2013-01-01T00:00:00.000').quarter() // 1
            moment('2013-04-01T00:00:00.000').subtract(1, 'ms').quarter() // 1
            moment('2013-04-01T00:00:00.000').quarter() // 2
            moment('2013-07-01T00:00:00.000').subtract(1, 'ms').quarter() // 2
            moment('2013-07-01T00:00:00.000').quarter() // 3
            moment('2013-10-01T00:00:00.000').subtract(1, 'ms').quarter() // 3
            moment('2013-10-01T00:00:00.000').quarter() // 4
            moment('2014-01-01T00:00:00.000').subtract(1, 'ms').quarter() // 4
            moment('2013-01-01T00:00:00.000').quarter(2) // '2013-04-01T00:00:00.000'
            moment('2013-02-05T05:06:07.000').quarter(2).format() // '2013-05-05T05:06:07-07:00'
            `,
                `
            import dayjs from 'dayjs';
            import quarterOfYear from 'dayjs/plugin/quarterOfYear';
            dayjs.extend(quarterOfYear);
            dayjs().quarter();
            dayjs().quarter(1);
            dayjs().quarter();
            dayjs().quarter(1);
            dayjs('2013-01-01T00:00:00.000').quarter() // 1
            dayjs('2013-04-01T00:00:00.000').subtract(1, 'ms').quarter() // 1
            dayjs('2013-04-01T00:00:00.000').quarter() // 2
            dayjs('2013-07-01T00:00:00.000').subtract(1, 'ms').quarter() // 2
            dayjs('2013-07-01T00:00:00.000').quarter() // 3
            dayjs('2013-10-01T00:00:00.000').subtract(1, 'ms').quarter() // 3
            dayjs('2013-10-01T00:00:00.000').quarter() // 4
            dayjs('2014-01-01T00:00:00.000').subtract(1, 'ms').quarter() // 4
            dayjs('2013-01-01T00:00:00.000').quarter(2) // '2013-04-01T00:00:00.000'
            dayjs('2013-02-05T05:06:07.000').quarter(2).format() // '2013-05-05T05:06:07-07:00'
            `
            );
        });
    });

    describe('relativeTime', () => {
        it('test relativeTime plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().from(moment('1990-01-01'));
            moment().from(moment('1990-01-01'), true);
            moment().fromNow();
            moment().to(moment('1990-01-01'));
            moment().toNow();
            `,
                `
            import dayjs from 'dayjs';
            import relativeTime from 'dayjs/plugin/relativeTime';
            dayjs.extend(relativeTime);
            dayjs().from(dayjs('1990-01-01'));
            dayjs().from(dayjs('1990-01-01'), true);
            dayjs().fromNow();
            dayjs().to(dayjs('1990-01-01'));
            dayjs().toNow();
            `
            );
        });
    });

    describe('toArray', () => {
        it('test toArray plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().toArray();
            `,
                `
            import dayjs from 'dayjs';
            import toArray from 'dayjs/plugin/toArray';
            dayjs.extend(toArray);
            dayjs().toArray();
            `
            );
        });
    });

    describe('toObject', () => {
        it('test toObject plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().toObject();
            `,
                `
            import dayjs from 'dayjs';
            import toObject from 'dayjs/plugin/toObject';
            dayjs.extend(toObject);
            dayjs().toObject();
            `
            );
        });
    });

    describe('updateLocale', () => {
        it('test updateLocale plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment.updateLocale('en', {
                months : [
                    "January", "February", "March", "April", "May", "June", "July",
                    "August", "September", "October", "November", "December"
                ]
            });
            `,
                `
            import dayjs from 'dayjs';
            import updateLocale from 'dayjs/plugin/updateLocale';
            dayjs.extend(updateLocale);
            dayjs.updateLocale('en', {
                months : [
                    "January", "February", "March", "April", "May", "June", "July",
                    "August", "September", "October", "November", "December"
                ]
            });
            `
            );
        });
    });

    describe('utc', () => {
        it('test utc plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().format();
            moment.utc().format();
            moment().utc().format();
            moment.utc().isUTC();
            moment.utc().local().format();
            moment.utc('2018-01-01', 'YYYY-MM-DD');
            moment().local();
            `,
                `
            import dayjs from 'dayjs';
            import utc from 'dayjs/plugin/utc';
            dayjs.extend(utc);
            dayjs().format();
            dayjs.utc().format();
            dayjs().utc().format();
            dayjs.utc().isUTC();
            dayjs.utc().local().format();
            dayjs.utc('2018-01-01', 'YYYY-MM-DD');
            dayjs().local();
            `
            );
        });
    });

    describe('weekOfYear', () => {
        it('test weekOfYear plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().week(1);
            moment().week();
            moment().weeks(1);
            moment().weeks();
            `,
                `
            import dayjs from 'dayjs';
            import weekOfYear from 'dayjs/plugin/weekOfYear';
            dayjs.extend(weekOfYear);
            dayjs().week(1);
            dayjs().week();
            dayjs().week(1);
            dayjs().week();
            `
            );
        });
    });

    describe('weekYear', () => {
        it('test weekYear plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().weekYear();
            `,
                `
            import dayjs from 'dayjs';
            import weekOfYear from 'dayjs/plugin/weekOfYear';
            dayjs.extend(weekOfYear);
            import weekYear from 'dayjs/plugin/weekYear';
            dayjs.extend(weekYear);
            dayjs().weekYear();
            `
            );
        });
    });

    describe('weekday', () => {
        it('test weekday plugin', async () => {
            await assertTransform(
                `
            import moment from 'moment';
            moment().weekday(-7);
            moment().weekday(7);
            moment().get('weekday');
            moment().get('weekdays');
            moment().set('weekday', 1);
            moment().set('weekdays', 1);
            `,
                `
            import dayjs from 'dayjs';
            import weekday from 'dayjs/plugin/weekday';
            dayjs.extend(weekday);
            dayjs().weekday(-7);
            dayjs().weekday(7);
            dayjs().weekday();
            dayjs().weekday();
            dayjs().weekday(1);
            dayjs().weekday(1);
            `
            );
        });
    });
});
