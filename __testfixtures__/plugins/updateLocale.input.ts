import moment from 'moment';

const main = () => {
  moment.updateLocale('en', {
    months : [
      "January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"
    ]
  });
};

main();
