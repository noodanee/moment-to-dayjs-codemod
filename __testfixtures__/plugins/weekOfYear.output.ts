import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);

const main = () => {
    dayjs().week(1);
    dayjs().week();
    dayjs().week(1);
    dayjs().week();
};

main();
