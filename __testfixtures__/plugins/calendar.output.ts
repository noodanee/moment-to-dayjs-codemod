import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
dayjs.extend(calendar);

const main = () => {
  dayjs().calendar();
};

main();
