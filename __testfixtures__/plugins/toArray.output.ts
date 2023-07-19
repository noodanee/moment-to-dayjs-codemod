import dayjs from 'dayjs';
import toArray from 'dayjs/plugin/toArray';
dayjs.extend(toArray);

const main = () => {
  dayjs().toArray();
};

main();
