import dayjs from 'dayjs';
import toObject from 'dayjs/plugin/toObject';
dayjs.extend(toObject);

const main = () => {
  dayjs().toObject();
};

main();
