import dayjs from 'dayjs';

const main = () => {
  // parameters
  dayjs().add(1, 'day').toDate();
  dayjs().add(1, 'day').toDate();
  const days = 1;
  dayjs().add(days, 'day').toDate();

  // get
  dayjs().year();
  dayjs().month();
  dayjs().day();
  dayjs().hour();
  dayjs().minute();
  dayjs().second();

  // get - plural
  dayjs().year();
  dayjs().month();
  dayjs().day();
  dayjs().hour();
  dayjs().minute();
  dayjs().second();

  // set
  dayjs().set('day', 1);
  dayjs().set('day', 1);

  // units
  dayjs().add(1, 'year').toDate();
  dayjs().add(1, 'year').toDate();
  dayjs().add(1, 'month').toDate();
  dayjs().add(1, 'month').toDate();
  dayjs().add(1, 'week').toDate();
  dayjs().add(1, 'week').toDate();
  dayjs().add(1, 'day').toDate();
  dayjs().add(1, 'day').toDate();
  dayjs().add(1, 'hour').toDate();
  dayjs().add(1, 'hour').toDate();
  dayjs().add(1, 'minute').toDate();
  dayjs().add(1, 'minute').toDate();
  dayjs().add(1, 'second').toDate();
  dayjs().add(1, 'second').toDate();
  dayjs().add(1, 'quarter').toDate();
};

main();
