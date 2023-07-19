import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
dayjs.extend(updateLocale);

const main = () => {
  dayjs.updateLocale('en', {
    months : [
      "January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"
    ]
  });
};

main();
