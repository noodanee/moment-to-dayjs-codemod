import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
dayjs.extend(dayOfYear);

const main = () => {
    dayjs().dayOfYear(1);
    dayjs().dayOfYear();
};

main();
