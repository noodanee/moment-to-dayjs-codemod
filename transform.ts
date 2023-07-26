import {
    API,
    ASTPath,
    CallExpression,
    Collection,
    FileInfo,
    Identifier,
    JSCodeshift,
    Transform,
    VariableDeclaration,
    VariableDeclarator,
} from 'jscodeshift';

type Next = () => Promise<void>;

type Plugin = {
    name: string;
    properties?: string[];
    find?: (path: ASTPath<any>) => boolean;
    replace?: (j: JSCodeshift, path: ASTPath<any>) => CallExpression | null;
    notImplemented?: boolean;
};

/**
 * @param str unit string
 * @return single unit (e.g. days => day)
 */
const toSingle = (str: string) => str.replace(/s$/, '');

// see: https://day.js.org/
const singleUnits = [
    'year',
    'month',
    'week',
    'date',
    'day',
    'hour',
    'minute',
    'second',
    'millisecond',
    'quarter',
    'weekday',
];

const multipleUnits = [
    'years',
    'months',
    'weeks',
    'dates',
    'days',
    'hours',
    'minutes',
    'seconds',
    'milliseconds',
    'quarters',
    'weekdays',
];

const units = [...singleUnits, ...multipleUnits];

const getPropertyName = (path: ASTPath<any>) => {
    return path.node?.callee?.property?.name ?? path.node?.property?.name;
};

const includesProperties = (path: ASTPath<any>, properties: string[]) => {
    const propertyName = getPropertyName(path);
    return properties.includes(propertyName);
};

const getImportStatement = (j: JSCodeshift, root: Collection<any>) => {
    const dImports = root.find(j.ImportDeclaration, {
        source: {
            value: 'dayjs',
        },
    });
    return (dImports.nodes().length > 0 && dImports.at(-1).get()) || null;
};

const getRequireStatement = (j: JSCodeshift, root: Collection<any>) => {
    const dRequires = root.find(j.VariableDeclaration, {
        declarations: [
            {
                id: {
                    name: 'dayjs',
                },
                init: {
                    callee: {
                        name: 'require',
                    },
                },
            },
        ],
    });
    return (dRequires.nodes().length > 0 && dRequires.at(-1).get()) || null;
};

// before : xxx({ days: 1 })
// after  : xxx({ day: 1 })
const replaceObjectArgument = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    root.find(j.CallExpression, (path: any) => {
        return (
            path.callee?.name === 'moment' &&
            path.arguments?.[0]?.type === 'ObjectExpression' &&
            path.arguments?.some((arg: any) =>
                units.includes(arg.properties[0].key?.name)
            )
        );
    }).replaceWith((path: ASTPath<any>) => {
        return j.callExpression.from({
            ...path.node,
            arguments: path.node.arguments.map((arg: any) => {
                return {
                    ...arg,
                    properties: arg.properties.map((p: any) => {
                        const includeUnit = units.includes(p.key.name);
                        return {
                            ...p,
                            key: includeUnit
                                ? j.identifier(toSingle(p.key.name))
                                : p.key,
                        };
                    }),
                };
            }),
        });
    });
    await next();
};

// before : xxx(1, 'days')
// after  : xxx(1, 'day')
const replaceArrayArgument = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    root.find(j.CallExpression, (path: any) => {
        return (
            path.callee?.object?.callee?.name === 'moment' &&
            path.arguments?.some((arg: any) => units.includes(arg.value))
        );
    }).replaceWith((path: ASTPath<any>) => {
        return j.callExpression.from({
            ...path.node,
            arguments: path.node.arguments.map((arg: any) => {
                const includeUnit = units.includes(arg.value);
                return includeUnit ? j.literal(toSingle(arg.value)) : arg;
            }),
        });
    });

    await next();
};

// before : days()
// after  : day()
const replaceUnitFunction = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    root.find(j.CallExpression, (path: any) => {
        const calleeName = path.callee?.object?.callee?.name;
        if (calleeName !== 'moment') return false;
        const propertyName = path.callee?.property?.name;
        return multipleUnits.includes(propertyName);
    }).replaceWith((path: ASTPath<any>) => {
        return j.callExpression.from({
            ...path.node,
            callee: j.memberExpression.from({
                ...path.node.callee,
                property: j.identifier(
                    toSingle(path.node.callee.property.name)
                ),
            }),
        });
    });
    await next();
};

const replaceLanguage = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    const foundLanguages = new Set<string>();
    root.find(j.CallExpression, (path: any) => {
        const calleeName = path.callee?.object?.name;
        const propertyName = path.callee?.property?.name;
        const args = path.arguments;
        return (
            calleeName === 'moment' && propertyName === 'locale' && args.length
        );
    }).replaceWith((path: any) => {
        const [lang, ...args] = path.node.arguments;
        lang.value = lang.value.toLowerCase();
        foundLanguages.add(lang.value);
        return j.callExpression.from({
            ...path.node,
            arguments: [lang, ...args],
        });
    });

    await next();

    Array.from(foundLanguages)
        .sort()
        .reverse()
        .forEach((lang) => {
            getImportStatement(j, root)?.insertAfter(
                j.importDeclaration.from({
                    source: j.literal(`dayjs/locale/${lang}`),
                })
            );
            getRequireStatement(j, root)?.insertAfter(
                j.expressionStatement.from({
                    expression: j.callExpression.from({
                        callee: j.identifier('require'),
                        arguments: [j.literal(`dayjs/locale/${lang}`)],
                    }),
                })
            );
        });
};

// replace import statement
// before : import moment from 'moment'
// after  : import dayjs from 'dayjs
const replaceImportDeclaration = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    root.find(j.ImportDeclaration)
        .filter((path: ASTPath<any>) => {
            const source = path.node?.source?.value;
            return source === 'moment';
        })
        .replaceWith((path: ASTPath<any>) => {
            return j.importDeclaration.from({
                source: j.literal('dayjs'),
                specifiers: [j.importDefaultSpecifier(j.identifier('dayjs'))],
            });
        });

    // duplicate import
    const cache: any = {};
    root.find(j.ImportDeclaration)
        .filter((path) => {
            const node = path.node;

            const value = node?.source?.value;
            if (typeof value === 'string' && value === 'dayjs') {
                if (cache[value]) {
                    return true;
                }
                cache[value] = true;
            }
            return false;
        })
        .remove();

    await next();
};

// replace require statement
// before : const moment = require('moment')
// after  : const dayjs = require('dayjs')
const replaceRequireDeclaration = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    root.find(j.VariableDeclaration)
        .filter((path: ASTPath<any>) => {
            const d = path?.node?.declarations?.[0];
            return (
                d?.init?.callee?.name === 'require' && d?.id?.name === 'moment'
            );
        })
        .replaceWith((path: ASTPath<any>) => {
            return j.variableDeclaration('const', [
                j.variableDeclarator(
                    j.identifier('dayjs'),
                    j.callExpression.from({
                        callee: j.identifier('require'),
                        arguments: [j.literal('dayjs')],
                    })
                ),
            ]);
        });

    // duplicate require
    const cache: any = {};
    root.find(j.VariableDeclaration)
        .filter((path) => {
            const node = path.node;

            if (node.type !== 'VariableDeclaration') return false;
            const d = node?.declarations?.[0];
            if (
                d.type !== 'VariableDeclarator' ||
                d?.init?.type !== 'CallExpression'
            )
                return false;
            const callee = d?.init?.callee;
            if (callee.type !== 'Identifier' || d.id.type !== 'Identifier')
                return false;
            if (callee.name === 'require' && d?.id?.name === 'dayjs') {
                if (cache[d.id.name]) {
                    return true;
                }
                cache[d.id.name] = true;
            }
            return false;
        })
        .remove();
    await next();
};

const replacePlugins = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    const plugins: Plugin[] = [
        {
            name: 'arraySupport',
            find: (path: ASTPath<any>) => {
                const callee = path.node?.callee;
                const args = path.node?.arguments;
                return (
                    callee?.type?.toString() === 'Identifier' &&
                    callee?.name === 'moment' &&
                    args?.[0]?.type?.toString() === 'ArrayExpression'
                );
            },
        },
        {
            name: 'calendar',
            properties: ['calendar'],
        },
        {
            name: 'dayOfYear',
            properties: ['dayOfYear'],
        },
        {
            name: 'duration',
            properties: ['duration', 'isDuration', 'humanize'],
        },
        {
            name: 'isBetween',
            properties: ['isBetween'],
        },
        {
            name: 'isSameOrAfter',
            properties: ['isSameOrAfter'],
        },
        {
            name: 'isSameOrBefore',
            properties: ['isSameOrBefore'],
        },
        {
            name: 'localeData',
            properties: ['localeData'],
        },
        {
            name: 'isLeapYear',
            properties: ['isLeapYear', 'isoWeeksInYear'],
        },
        {
            name: 'isoWeek',
            properties: ['isoWeek', 'isoWeekday', 'isoWeekYear'],
            find: (path: ASTPath<any>) => {
                const args = path.node?.arguments;
                return (
                    ['add', 'subtract', 'startOf', 'endOf'].includes(
                        path.node?.callee?.property?.name
                    ) && ['isoWeek'].includes(args?.[0]?.value)
                );
            },
        },
        {
            name: 'isoWeeksInYear',
            properties: ['isoWeeksInYear'],
        },
        {
            name: 'minMax',
            find: (path: ASTPath<any>) => {
                return (
                    ['min', 'max'].includes(
                        path.node?.callee?.property?.name
                    ) && path.node?.callee?.object?.name === 'dayjs'
                );
            },
        },
        {
            name: 'objectSupport',
            find: (path: ASTPath<any>) => {
                const isMomentConstructor =
                    path.node?.callee?.type === 'Identifier' &&
                    path.node?.callee?.name === 'moment';
                const isObjectSupportFunction = [
                    'utc',
                    'set',
                    'add',
                    'subtract',
                ].includes(path.node?.callee?.property?.name);
                return (
                    (isMomentConstructor || isObjectSupportFunction) &&
                    path.node?.arguments?.[0]?.type?.toString() ===
                        'ObjectExpression'
                );
            },
            replace: (j: JSCodeshift, path: ASTPath<any>) => {
                return j.callExpression.from({
                    ...path.node,
                    arguments: path.node.arguments.map((arg: any) => {
                        return {
                            ...arg,
                            properties: arg.properties.map((p: any) => {
                                const includeUnit = units.includes(p.key?.name);
                                return {
                                    ...p,
                                    key: includeUnit
                                        ? j.identifier(toSingle(p.key?.name))
                                        : p.key,
                                };
                            }),
                        };
                    }),
                });
            },
        },
        {
            name: 'quarterOfYear',
            properties: ['quarter'],
            find: (path: ASTPath<any>) => {
                const args = path.node?.arguments;
                return (
                    ['add', 'subtract', 'startOf', 'endOf'].includes(
                        path.node?.callee?.property?.name
                    ) && ['quarter', 'quarters'].includes(args?.[0]?.value)
                );
            },
        },
        {
            name: 'relativeTime',
            properties: ['from', 'fromNow', 'to', 'toNow', 'humanize'],
        },
        {
            name: 'toArray',
            properties: ['toArray'],
        },
        {
            name: 'toObject',
            properties: ['toObject'],
        },
        {
            name: 'updateLocale',
            properties: ['updateLocale'],
        },
        {
            name: 'utc',
            properties: ['utc', 'local'],
        },
        {
            name: 'weekday',
            properties: ['weekday', 'weekdays'],
            find: (path: ASTPath<any>) => {
                const args = path.node?.arguments;
                return (
                    ['get', 'set'].includes(
                        path.node?.callee?.property?.name
                    ) && ['weekday', 'weekdays'].includes(args?.[0]?.value)
                );
            },
        },
        {
            name: 'weekOfYear',
            properties: ['week', 'weekYear'],
        },
        {
            name: 'weekYear',
            properties: ['weekYear'],
        },
    ];

    const foundPlugins = new Set<string>();
    const checkPlugins = (path: ASTPath<any>) => {
        const newPlugins = plugins.filter((plugin) => {
            if (
                (plugin.properties &&
                    includesProperties(path, plugin.properties)) ||
                plugin?.find?.(path)
            ) {
                if (plugin.notImplemented) {
                    throw new Error(
                        `Not implemented plugin '${plugin.name}' found.`
                    );
                }
                return true;
            }
        });
        newPlugins.forEach((p) => foundPlugins.add(p.name));
        return newPlugins;
    };

    // replace function and arguments
    // before : moment().xxx(1, 'days') / moment().days()
    // after  : dayjs().xxx(1, 'day') / dayjs().day()
    const replace = (path: ASTPath<any>) => {
        const type = path?.value?.type?.toString();
        let replacement: any = null;
        if (type === j.CallExpression.toString()) {
            const plugins = checkPlugins(path);
            const replaceByPlugin = plugins.find((p) => p.replace)?.replace;
            replacement = replaceByPlugin?.(j, path);
        }
        if (path?.parentPath) {
            replace(path.parentPath);
        }
        if (replacement) {
            path.replace(replacement);
        }
    };

    root.find(j.MemberExpression, {
        object: {
            callee: {
                name: 'moment',
            },
        },
    }).replaceWith((path: ASTPath<any>) => {
        checkPlugins(path);
        replace(path);
        return j.memberExpression.from({
            ...path.node,
            object: {
                ...path.node.object,
                callee: j.identifier('dayjs'),
            },
        });
    });

    root.find(j.MemberExpression, {
        object: {
            name: 'moment',
        },
    }).replaceWith((path: ASTPath<any>) => {
        checkPlugins(path);
        replace(path);
        return j.memberExpression.from({
            ...path.node,
            object: j.identifier('dayjs'),
        });
    });

    root.find(j.CallExpression, {
        callee: {
            object: { name: 'moment' },
        },
    }).replaceWith((path: ASTPath<any>) => {
        checkPlugins(path);
        replace(path);
        return j.callExpression.from({
            ...path.node,
            callee: j.memberExpression.from({
                ...path.node.callee,
                object: j.identifier('dayjs'),
            }),
        });
    });

    root.find(j.CallExpression, {
        callee: {
            name: 'moment',
        },
    }).replaceWith((path: ASTPath<any>) => {
        checkPlugins(path);
        replace(path);
        return j.callExpression.from({
            ...path.node,
            callee: j.identifier('dayjs'),
        });
    });

    await next();

    Array.from(foundPlugins)
        .sort()
        .reverse()
        .forEach((p) => {
            const importStatement = getImportStatement(j, root);
            importStatement?.insertAfter(
                j.expressionStatement.from({
                    expression: j.callExpression.from({
                        callee: j.memberExpression.from({
                            object: j.identifier('dayjs'),
                            property: j.identifier('extend'),
                        }),
                        arguments: [j.identifier(p)],
                    }),
                })
            );
            importStatement?.insertAfter(
                j.importDeclaration.from({
                    source: j.literal(`dayjs/plugin/${p}`),
                    specifiers: [
                        j.importDefaultSpecifier.from({
                            local: j.identifier(p),
                        }),
                    ],
                })
            );

            const requireStatement = getRequireStatement(j, root);
            requireStatement?.insertAfter(
                j.expressionStatement.from({
                    expression: j.callExpression.from({
                        callee: j.memberExpression.from({
                            object: j.identifier('dayjs'),
                            property: j.identifier('extend'),
                        }),
                        arguments: [j.identifier(p)],
                    }),
                })
            );
            requireStatement?.insertAfter(
                j.variableDeclaration('const', [
                    j.variableDeclarator(
                        j.identifier(p),
                        j.callExpression.from({
                            callee: j.identifier('require'),
                            arguments: [j.literal(`dayjs/plugin/${p}`)],
                        })
                    ),
                ])
            );
        });
};

// before: moment.isMoment()
// after : dayjs.isDayjs()
const replaceAssertFunction = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    root.find(j.CallExpression, {
        callee: {
            object: {
                name: 'moment',
            },
            property: {
                name: 'isMoment',
            },
        },
    }).replaceWith((path: ASTPath<any>) => {
        return j.callExpression.from({
            callee: j.memberExpression.from({
                object: j.identifier('dayjs'),
                property: j.identifier('isDayjs'),
            }),
            arguments: path.node.arguments,
        });
    });
    await next();
};

// before : m: moment.Moment = moment()
// after  : d: dayjs.Dayjs = dayjs()
const replaceTypeHint = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    root.find(j.TSTypeReference, (path) => {
        if (path?.typeName?.type === 'TSQualifiedName') {
            const left = path.typeName.left as Identifier;
            const right = path.typeName.right as Identifier;
            if (left) {
                return (
                    left.name === 'moment' &&
                    (right?.name === 'Moment' || right?.name === 'MomentInput')
                );
            }
        }
        if (path?.typeName?.type === 'Identifier') {
            return (
                path.typeName.name === 'Moment' ||
                path.typeName.name === 'MomentInput'
            );
        }
        return false;
    }).replaceWith(() => {
        return j.tsTypeReference.from({
            typeName: j.tsQualifiedName.from({
                left: j.identifier('dayjs'),
                right: j.identifier('Dayjs'),
            }),
        });
    });
    await next();
};

// before : moment().now()
// after  : dayjs().valueOf()
const replaceNowFunction = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    root.find(j.CallExpression, {
        callee: {
            object: {
                name: 'moment',
            },
            property: {
                name: 'now',
            },
        },
        arguments: [],
    }).replaceWith((path: ASTPath<any>) => {
        return j.callExpression.from({
            callee: j.memberExpression.from({
                object: j.callExpression.from({
                    callee: j.identifier('dayjs'),
                    arguments: [],
                }),
                property: j.identifier('valueOf'),
            }),
            arguments: [],
        });
    });
    await next();
};

// before : get('days') / set('days', 1)
// after  : day() / day(1)
const replaceGetSetToFunction = async (
    j: JSCodeshift,
    root: Collection<any>,
    next: Next
) => {
    root.find(j.CallExpression, (path: any) => {
        return (
            path.callee?.object?.callee?.name === 'moment' &&
            ['get', 'set'].includes(path.callee?.property?.name)
        );
    }).replaceWith((path: ASTPath<any>) => {
        return j.callExpression.from({
            ...path.node,
            callee: j.memberExpression.from({
                ...path.node.callee,
                property: (() => {
                    if (path.node?.arguments?.[0]?.type === 'Literal') {
                        return j.identifier(
                            toSingle(path.node?.arguments?.[0].value)
                        );
                    }
                    return path.node.callee.property;
                })(),
            }),
            arguments: (() => {
                if (path.node?.arguments?.[0].type === 'Literal') {
                    return path.node?.arguments?.slice(1);
                }
                if (path.node?.arguments?.[0]?.type === 'ObjectExpression') {
                    path.node.arguments[0] = j.objectExpression(
                        path.node?.arguments?.[0]?.properties.map((p: any) => {
                            const includeUnit = multipleUnits.includes(
                                p.key.name
                            );
                            return {
                                ...p,
                                key: includeUnit
                                    ? j.identifier(toSingle(p.key.name))
                                    : p.key,
                            };
                        })
                    );
                    return path.node.arguments;
                }
            })(),
        });
    });

    await next();
};

const transform = async (file: FileInfo, api: API) => {
    const jscodeshift = api.jscodeshift;
    const root = jscodeshift(file.source);

    const replacerChain = async (replaces: any[]) => {
        const len = replaces.length;
        const dispatch = async (i: number): Promise<void> => {
            if (i < len) {
                const fn = replaces[i];
                if (fn) {
                    await fn(jscodeshift, root, () => dispatch(i + 1));
                }
            }
        };
        await dispatch(0);
    };

    await replacerChain([
        replaceImportDeclaration,
        replaceRequireDeclaration,
        replaceAssertFunction,
        replaceTypeHint,
        replaceNowFunction,
        replaceUnitFunction,
        replaceObjectArgument,
        replaceArrayArgument,
        replaceGetSetToFunction,
        replaceLanguage,
        replacePlugins,
    ]);

    return root.toSource({
        trailingComma: true,
        quote: 'single',
    });
};

export default transform;
