# moment-to-dayjs-codemod

A [jscodeshift](https://github.com/facebook/jscodeshift) tranformer for migrating [moment](https://github.com/moment/moment) to [dayjs](https://github.com/iamkun/dayjs).

## How to use

```sh
$ git clone https://github.com/noodanee/moment-to-dayjs-codemod.git
$ cd moment-to-dayjs-codemod
$ npm install

# dry run
$ npm run transform -- -d -p path/to/file

# exec
$ npm run transform -- path/to/file
```

## Supported dayjs plugins

- [x] [arraySupport](https://day.js.org/docs/en/plugin/array-support)
- [x] [calendar](https://day.js.org/docs/en/plugin/calendar)
- [x] [dayOfYear](https://day.js.org/docs/en/plugin/day-of-year)
- [x] [duration](https://day.js.org/docs/en/plugin/duration)
- [x] [isBetween](https://day.js.org/docs/en/plugin/is-between)
- [x] [isLeapYear](https://day.js.org/docs/en/plugin/is-leap-year)
- [x] [isoWeek](https://day.js.org/docs/en/plugin/iso-week)
- [x] [isoWeeksInYear](https://day.js.org/docs/en/plugin/iso-weeks-in-year)
- [x] [isSameOrAfter](https://day.js.org/docs/en/plugin/is-same-or-after)
- [x] [isSameOrBefore](https://day.js.org/docs/en/plugin/is-same-or-before)
- [x] [localeData](https://day.js.org/docs/en/plugin/locale-data)
- [x] [minMax](https://day.js.org/docs/en/plugin/min-max)
- [x] [objectSupport](https://day.js.org/docs/en/plugin/object-support)
- [x] [quarterOfYear](https://day.js.org/docs/en/plugin/quarter-of-year)
- [x] [relativeTime](https://day.js.org/docs/en/plugin/relative-time)
- [x] [toArray](https://day.js.org/docs/en/plugin/to-array)
- [x] [toObject](https://day.js.org/docs/en/plugin/to-object)
- [x] [updateLocale](https://day.js.org/docs/en/plugin/update-locale)
- [x] [utc](https://day.js.org/docs/en/plugin/utc)
- [x] [weekday](https://day.js.org/docs/en/plugin/weekday)
- [x] [weekOfYear](https://day.js.org/docs/en/plugin/week-of-year)
- [x] [weekYear](https://day.js.org/docs/en/plugin/week-year)

## Test
```
$ npm run test
```
