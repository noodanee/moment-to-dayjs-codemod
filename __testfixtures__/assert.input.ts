import moment from 'moment';

const main = () => {
  moment.isMoment(new Date());
  moment.isMoment(moment());
};

main();
