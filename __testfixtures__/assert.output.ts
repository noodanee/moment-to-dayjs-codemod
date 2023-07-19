import dayjs from 'dayjs';

const main = () => {
  dayjs.isDayjs();
  dayjs.isDayjs(new Date());
  dayjs.isDayjs(dayjs());
};

main();
