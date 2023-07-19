import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
dayjs.extend(localeData);

const main = () => {
  dayjs().localeData();
};

main();
