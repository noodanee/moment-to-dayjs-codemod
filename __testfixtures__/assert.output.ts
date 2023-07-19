import dayjs from 'dayjs';

const main = () => {
  dayjs.isDayjs(new Date());
  dayjs.isDayjs(dayjs());
};

main();
