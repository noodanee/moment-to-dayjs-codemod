import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
dayjs.extend(quarterOfYear);

const main = () => {
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
};

main();
