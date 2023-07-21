import {
    API,
    ASTPath,
    CallExpression,
    FileInfo, Identifier,
    JSCodeshift,
    Transform, VariableDeclaration, VariableDeclarator,
} from 'jscodeshift';

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
    'quarter',
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
    'quarters',
];

const units = [...singleUnits, ...multipleUnits];

const getPropertyName = (path: ASTPath<any>) => {
    return path.node?.callee?.property?.name ?? path.node?.property?.name;
}

const includesProperties = (path: ASTPath<any>, properties: string[]) => {
    const propertyName = getPropertyName(path);
    return properties.includes(propertyName);
};

const getCalleeName = (path: ASTPath<any>) => {
    const callee = path.node?.callee;
    if (callee?.type === 'MemberExpression') {
        return callee.object.name;
    }
    if (callee?.type === 'Identifier') {
        return callee.name;
    }
    return callee?.name;
}

const getArguments = (path: ASTPath<any>) => {
    return path.node?.arguments;
}

/**
 * before : xxx({ days: 1 })
 * after  : xxx({ day: 1 })
 * @param j JSCodeshift Object
 * @param path ASTPath Object
 * @returns return new node. return null if not need to replace.
 */
const replaceObjectArgument = (j: JSCodeshift, path: ASTPath<any>) => {
    const args = path.node?.arguments;
    if (!args?.[0]?.properties?.length) {
        return null;
    }

    const needReplace = args.some((a: any) =>
        units.includes(a.properties[0].key?.name)
    );
    if (!needReplace) {
        return null;
    }

    const newArgs = args.map((a: any) => {
        return {
            ...a,
            properties: a.properties.map((p: any) => {
                const includeUnit = units.includes(p.key.name);
                return {
                    ...p,
                    key: includeUnit ? j.identifier(toSingle(p.key.name)) : p.key,
                };
            }),
        };
    });

    return j.callExpression.from({
        ...path.node,
        arguments: newArgs,
    });
};

/**
 * before : xxx(1, 'days')
 * after  : xxx(1, 'day')
 * @param j JSCodeshift Object
 * @param path ASTPath Object
 * @returns return new node. return null if not need to replace.
 */
const replaceArrayArugment = (j: JSCodeshift, path: ASTPath<any>) => {
    const args = path.node?.arguments;
    if (!args?.length) {
        return null;
    }

    const needReplace = args.some((a: any) => units.includes(a.value));
    if (!needReplace) {
        return null;
    }

    const newArgs = args.map((a: any) => {
        const includeUnit = units.includes(a.value);
        return includeUnit ? j.literal(toSingle(a.value)) : a;
    });

    return j.callExpression.from({
        ...path.node,
        arguments: newArgs,
    });
};

/**
 * before : days()
 * after  : day()
 * @param j JSCodeshift Object
 * @param path ASTPath Object
 * @returns return new node. return null if not need to replace.
 */
const replaceUnitFunction = (j: JSCodeshift, path: ASTPath<any>) => {
    const propertyName = getPropertyName(path);
    if (!multipleUnits.includes(propertyName)) {
        return null;
    }

    const newCallee = j.memberExpression.from({
        ...path.node.callee,
        property: j.identifier(toSingle(propertyName)),
    });

    return j.callExpression.from({
        ...path.node,
        callee: newCallee,
    });
};

const replaceLanguageArgument = (j: JSCodeshift, path: ASTPath<any>) => {
    const propertyName = getPropertyName(path);
    if (propertyName !== 'locale') {
        return;
    }
    const [lang, ...args] = getArguments(path);
    if (!lang) {
        return;
    }
    lang.value = lang.value.toLowerCase();
    return j.callExpression.from({
        ...path.node,
        arguments: [lang, ...args],
    })
}

const replaceImportDeclaration = (j: JSCodeshift, path: ASTPath<any>) => {
    j(path)
        .find(j.ImportDeclaration)
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
    j(path).find(j.ImportDeclaration).filter((path) => {
        const node = path.node;

        const value = node?.source?.value;
        if (typeof value === 'string' && value === 'dayjs') {
            if (cache[value]) {
                return true;
            }
            cache[value] = true;
        }
        return false;
    }).remove();
}

const replaceRequireDeclaration = (j: JSCodeshift, path: ASTPath<any>) => {
    j(path)
        .find(j.VariableDeclaration)
        .filter((path: ASTPath<any>) => {
            const d = path?.node?.declarations?.[0];
            return d?.init?.callee?.name === 'require' && d?.id?.name === 'moment';
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
    j(path).find(j.VariableDeclaration).filter((path) => {
        const node = path.node;

        if (node.type !== 'VariableDeclaration') return false;
        const d = node?.declarations?.[0];
        if (d.type !== 'VariableDeclarator' || d?.init?.type !== 'CallExpression') return false;
        const callee = d?.init?.callee;
        if (callee.type !== 'Identifier' || d.id.type !== 'Identifier') return false;
        if (callee.name === 'require' && d?.id?.name === 'dayjs') {
            if (cache[d.id.name]) {
                return true;
            }
            cache[d.id.name] = true;
        }
        return false;
    }).remove();
}

// moment.isMoment() to dayjs.isDayjs()
const replaceAssertFunction = (j: JSCodeshift, path: ASTPath<any>) => {
    const propertyName = getPropertyName(path);
    if (propertyName !== 'isMoment') {
        return;
    }
    return j.callExpression.from({
        callee: j.memberExpression.from({
            object: j.identifier('dayjs'),
            property: j.identifier('isDayjs'),
        }),
        arguments: path.node.arguments,
    });
}

/**
 * before : get('days') / set('days', 1)
 * after  : day() / day(1)
 * @param j JSCodeshift Object
 * @param path ASTPath Object
 * @returns return new node. return null if not need to replace.
 */
const replaceGetSetToFunction = (j: JSCodeshift, path: ASTPath<any>) => {
    const args = path.node?.arguments;
    if (typeof args?.[0]?.value !== 'string') {
        return null;
    }

    const propertyName = getPropertyName(path);
    if (
        (propertyName === 'get' && args.length !== 1) ||
        (propertyName === 'set' && args.length !== 2)
    ) {
        return null;
    }

    const newCallee = j.memberExpression.from({
        ...path.node.callee,
        property: j.identifier(toSingle(args[0].value)),
    });
    const newArgs = args.slice(1);

    return j.callExpression.from({
        ...path.node,
        callee: newCallee,
        arguments: newArgs,
    });
};

type Plugin = {
    name: string;
    properties?: string[];
    find?: (path: ASTPath<any>) => boolean;
    replace?: (j: JSCodeshift, path: ASTPath<any>) => CallExpression | null;
    notImplemented?: boolean;
};
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
            const propertyName = getPropertyName(path);
            const args = path.node?.arguments;
            return (
                ['add', 'subtract', 'startOf', 'endOf'].includes(propertyName) &&
                ['isoWeek'].includes(args?.[0]?.value)
            );
        }
    },
    {
        name:'isoWeeksInYear',
        properties: ['isoWeeksInYear'],
    },
    {
        name: 'minMax',
        find: (path: ASTPath<any>) => {
            const propertyName = getPropertyName(path);
            return (
                ['min', 'max'].includes(propertyName) &&
                getCalleeName(path) === 'dayjs'
            );
        }
    },
    {
        name: 'objectSupport',
        find: (path: ASTPath<any>) => {
            const callee = path.node?.callee;
            const args = path.node?.arguments;
            const isMomentConstructor =
                callee?.type?.toString() === 'Identifier' && callee?.name === 'moment';
            const isObjectSupportFunction = [
                'utc',
                'set',
                'add',
                'subtract',
            ].includes(getPropertyName(path));
            return (
                (isMomentConstructor || isObjectSupportFunction) &&
                args?.[0]?.type?.toString() === 'ObjectExpression'
            );
        },
    },
    {
        name: 'quarterOfYear',
        properties: ['quarter'],
        find: (path: ASTPath<any>) => {
            const propertyName = getPropertyName(path);
            const args = path.node?.arguments;
            return (
                ['add', 'subtract', 'startOf', 'endOf'].includes(propertyName) &&
                ['quarter', 'quarters'].includes(args?.[0]?.value)
            );
        }
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
        properties: ['weekday'],
        find: (path: ASTPath<any>) => {
            const propertyName = getPropertyName(path);
            const args = path.node?.arguments;
            return (
                ['get', 'set'].includes(propertyName) &&
                ['weekday', 'weekdays'].includes(args?.[0]?.value)
            );
        },
        replace: replaceGetSetToFunction,
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

const transform: Transform = (file: FileInfo, api: API) => {
    const j = api.jscodeshift;
    const root = j(file.source);

    // replace import statement
    // before : import moment from 'moment'
    // after  : import dayjs from 'dayjs
    replaceImportDeclaration(j, root.find(j.Program).get());

    // replace require statement
    // before : const moment = require('moment')
    // after  : const dayjs = require('dayjs')
    replaceRequireDeclaration(j, root.find(j.Program).get());

    const foundPlugins = new Set<string>();
    const checkPlugins = (path: ASTPath<any>) => {
        const newPlugins = plugins.filter((plugin) => {
            if (
                (plugin.properties && includesProperties(path, plugin.properties)) ||
                plugin?.find?.(path)
            ) {
                if (plugin.notImplemented) {
                    throw new Error(`Not implemented plugin '${plugin.name}' found.`);
                }
                return true;
            }
        });
        newPlugins.forEach((p) => foundPlugins.add(p.name));
        return newPlugins;
    };

    const foundLanguages = new Set<string>();
    const findLanguage = (path: ASTPath<any>) => {
        const propertyName = getPropertyName(path);
        if (propertyName !== 'locale') {
            return;
        }
        const [lang] = getArguments(path);
        if (!lang) {
            return;
        }
        foundLanguages.add(lang.value.toLowerCase());
    }

    // replace function and arguments
    // before : moment().xxx(1, 'days') / moment().days()
    // after  : dayjs().xxx(1, 'day') / dayjs().day()
    const replace = (path: ASTPath<any>) => {
        const type = path?.value?.type?.toString();
        let replacement: any = null;
        if (type === j.CallExpression.toString()) {
            const plugins = checkPlugins(path);
            const replaceByPlugin = plugins.find((p) => p.replace)?.replace;
            replacement =
                replaceByPlugin?.(j, path) ||
                replaceAssertFunction(j, path) ||
                replaceLanguageArgument(j, path) ||
                replaceObjectArgument(j, path) ||
                replaceArrayArugment(j, path) ||
                replaceUnitFunction(j, path);
        }
        if (path?.parentPath) {
            replace(path.parentPath);
        }
        if (replacement) {
            path.replace(replacement);
        }
    };

    // moment.now() to dayjs().valueOf()
    root.find(j.CallExpression, {
        callee: {
            object: {
                name: 'moment',
            },
            property: {
                name: 'now',
            },
        },
        arguments: []
    })
        .replaceWith( (path: ASTPath<any>) => {
            return j.callExpression.from({
                callee: j.memberExpression.from({
                    object: j.callExpression.from({
                        callee: j.identifier('dayjs'),
                        arguments: []
                    }),
                    property: j.identifier('valueOf'),
                }),
                arguments: [],
            });
        });

    // type
    root.find(j.TSTypeReference, (value) => {
        if (value?.typeName?.type === 'TSQualifiedName') {
            const left = value.typeName.left as Identifier
            const right = value.typeName.right as Identifier
            if (left) {
                return left.name === 'moment' && (right?.name === 'Moment' || right?.name === 'MomentInput');
            }
        }
        if (value?.typeName?.type === 'Identifier') {
            return value.typeName.name === 'Moment' || value.typeName.name === 'MomentInput';
        }
        return false;
    })
        .replaceWith(() => {
            return j.tsTypeReference.from({
                typeName: j.tsQualifiedName.from({
                    left: j.identifier('dayjs'),
                    right: j.identifier('Dayjs'),
                }),
            });
        });

    // before : moment.xxx().yyy()
    // after  : dayjs.xxx().yyy()
    root.find(j.MemberExpression, {
        object: {
            callee: {
                object: { name: 'moment' },
            }
        },
    })
        .replaceWith((path: ASTPath<any>) => {
            checkPlugins(path);
            findLanguage(path);
            replace(path);
            return j.memberExpression.from({
                ...path.node,
                object: {
                    ...path.node.object,
                    callee: {
                        ...path.node.object.callee,
                        object: j.identifier('dayjs'),
                    }
                },
            });
        });


    // replace static function
    // before : moment.xxx()
    // after  : dayjs.xxx()
    root.find(j.CallExpression, {
        callee: {
            object: { name: 'moment' },
        },
    })
        .replaceWith((path: ASTPath<any>) => {
            checkPlugins(path);
            findLanguage(path);
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
    })
        .replaceWith((path: ASTPath<any>) => {
            checkPlugins(path);
            findLanguage(path);
            replace(path);
            return j.callExpression.from({
                ...path.node,
                callee: j.identifier('dayjs'),
            });
        });

    root.find(j.Identifier, {
        name: 'moment',
    })
        .replaceWith((path: ASTPath<any>) => {
            return j.identifier('dayjs');
        });

    // plugins
    const dImports = root.find(j.ImportDeclaration, {
        source: {
            value: 'dayjs',
        },
    });
    const dImport = dImports.nodes().length > 0 && dImports.at(-1).get();
    Array.from(foundPlugins)
        .sort()
        .reverse()
        .forEach((p) => {
            if (!dImport) {
                return;
            }
            dImport.insertAfter(
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
            dImport.insertAfter(
                j.importDeclaration.from({
                    source: j.literal(`dayjs/plugin/${p}`),
                    specifiers: [
                        j.importDefaultSpecifier.from({
                            local: j.identifier(p),
                        }),
                    ],
                })
            );
        });
    Array.from(foundLanguages).sort().reverse().forEach((lang) => {
        if (!dImport) {
            return;
        }
        dImport.insertAfter(
            j.importDeclaration.from({
                source: j.literal(`dayjs/locale/${lang}`),
            })
        );
    })

    const dRequires = root.find(j.VariableDeclaration, {
        declarations: [
            {
                id: {
                    name: 'dayjs'
                },
                init: {
                    callee: {
                        name: 'require'
                    }
                },
            },
        ],
    });
    const dRequire = dRequires.nodes().length > 0 && dRequires.at(-1).get();
    Array.from(foundPlugins)
        .sort()
        .reverse()
        .forEach((p) => {
            if (!dRequire) {
                return;
            }
            dRequire.insertAfter(
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
            dRequire.insertAfter(
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
    Array.from(foundLanguages).sort().reverse().forEach((lang) => {
        if (!dRequire) {
            return;
        }
        dRequire.insertAfter(
            j.expressionStatement.from({
                expression: j.callExpression.from({
                    callee: j.identifier('require'),
                    arguments: [j.literal(`dayjs/locale/${lang}`)],
                })
            })
        );
    })

    return root.toSource({
        trailingComma: true,
        quote: 'single',
    });
};

export default transform;
