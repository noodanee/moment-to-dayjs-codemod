import dayjs from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear';
dayjs.extend(isLeapYear);

const main = () => {
    dayjs().isLeapYear();
};

main();
