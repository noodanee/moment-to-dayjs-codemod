import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
import weekYear from 'dayjs/plugin/weekYear';
dayjs.extend(weekYear);

const main = () => {
    dayjs().weekYear();
};

main();
