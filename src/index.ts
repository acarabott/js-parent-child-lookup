import { add, complete, cycle, save, suite } from "benny";

interface ID {
    id: number;
}

interface Parent extends ID {}

interface Child extends ID {
    parentId: Parent["id"];
}

const NUM_PARENTS = 10;
const NUM_CHILDREN = 5000;

const defArrays = () => {
    const parents: Parent[] = Array.from(Array(NUM_PARENTS), (_, i) => ({ id: i }));

    const children: Child[] = Array.from(
        Array(NUM_CHILDREN),
        (_, i): Child => ({ id: i, parentId: parents[i % parents.length].id }),
    );

    return { parents, children };
};

const defObjs = () => {
    const { parents, children } = defArrays();

    const parentsObj: Record<Parent["id"], Parent> = parents.reduce((accum, cur) => ({ ...accum, [cur.id]: cur }), {});
    const childrenObj: Record<Child["id"], Child> = children.reduce((accum, cur) => ({ ...accum, [cur.id]: cur }), {});

    return { parentsObj, childrenObj, parents, children };
};

const defCachedFind = (parents: Parent[]) => {
    const cache: Record<Parent["id"], Parent> = {};

    return (parentId: Parent["id"]) => {
        const found: Parent | undefined = cache[parentId];
        if (found !== undefined) {
            return found;
        }

        for (const parent of parents) {
            if (parent.id === parentId) {
                cache[parent.id] = parent;
                return parent;
            }
        }

        throw new Error("Parent not found");
    };
};

const defCachedFindMap = <T extends ID>(items: T[]) => {
    const cache = new Map<ID["id"], T>();

    return (id: T["id"]) => {
        let cached: T | undefined = cache.get(id);
        if (cached !== undefined) {
            return cached;
        }

        for (const item of items) {
            if (item.id === id) {
                cache.set(item.id, item);
                return item;
            }
        }

        throw new Error("Item not found");
    };
};

suite(
    "Find The Thing",

    add("find", () => {
        const { children, parents } = defArrays();

        return () => {
            const relationships: Array<[Child, Parent]> = [];
            for (const child of children) {
                const parent = parents.find((parent) => parent.id === child.parentId);
                if (parent !== undefined) {
                    relationships.push([child, parent]);
                } else {
                    throw new Error("Parent not found");
                }
            }
            return relationships;
        };
    }),

    add("find helper", () => {
        const { children, parents } = defArrays();

        const findOrThrow = <T>(things: T[], predicate: (thing: T) => boolean) => {
            const found = things.find(predicate);
            if (found !== undefined) {
                return found;
            }
            throw new Error("Could not find item");
        };

        return () => {
            const relationships: Array<[Child, Parent]> = [];
            for (const child of children) {
                const parent = findOrThrow(parents, (parent) => parent.id === child.parentId);
                relationships.push([child, parent]);
            }
            return relationships;
        };
    }),

    add("find helper - specific", () => {
        const { children, parents } = defArrays();

        const findOrThrowSpecific = (parents: Parent[], id: Parent["id"]) => {
            const parent = parents.find((parent) => parent.id === id);
            if (parent !== undefined) {
                return parent;
            }
            throw new Error("Could not find item");
        };

        return () => {
            const relationships: Array<[Child, Parent]> = [];
            for (const child of children) {
                const parent = findOrThrowSpecific(parents, child.parentId);
                relationships.push([child, parent]);
            }
            return relationships;
        };
    }),

    add("for of", () => {
        const { children, parents } = defArrays();

        return () => {
            const relationships: Array<[Child, Parent]> = [];

            for (const child of children) {
                let found: Parent | undefined;
                for (const parent of parents) {
                    if (parent.id === child.parentId) {
                        found = parent;
                    }
                }

                if (found !== undefined) {
                    relationships.push([child, found]);
                } else {
                    throw new Error("Parent not found");
                }
            }

            return relationships;
        };
    }),

    add("for", () => {
        const { children, parents } = defArrays();

        return () => {
            const relationships: Array<[Child, Parent]> = [];

            for (const child of children) {
                let found: Parent | undefined;

                for (let i = 0; i < parents.length; i++) {
                    if (parents[i].id === child.parentId) {
                        found = parents[i];
                    }
                }

                if (found !== undefined) {
                    relationships.push([child, found]);
                } else {
                    throw new Error("Parent not found");
                }
            }

            return relationships;
        };
    }),

    add("for of cached", () => {
        const { children, parents } = defArrays();

        return () => {
            const cache: Record<Parent["id"], Parent> = {};
            const relationships: Array<[Child, Parent]> = [];

            for (const child of children) {
                let found: Parent | undefined = cache[child.parentId];
                if (found === undefined) {
                    for (const parent of parents) {
                        if (parent.id === child.parentId) {
                            found = parent;
                            cache[found.id] = found;
                        }
                    }
                }

                if (found !== undefined) {
                    relationships.push([child, found]);
                } else {
                    throw new Error("Parent not found");
                }
            }

            return relationships;
        };
    }),

    add("for cached", () => {
        const { children, parents } = defArrays();

        return () => {
            const cache: Record<Parent["id"], Parent> = {};
            const relationships: Array<[Child, Parent]> = [];

            for (const child of children) {
                let found: Parent | undefined = cache[child.parentId];

                if (found === undefined) {
                    for (let i = 0; i < parents.length; i++) {
                        if (parents[i].id === child.parentId) {
                            found = parents[i];
                            cache[found.id] = found;
                        }
                    }
                }

                if (found !== undefined) {
                    relationships.push([child, found]);
                } else {
                    throw new Error("Parent not found");
                }
            }

            return relationships;
        };
    }),

    add("objects", () => {
        const { childrenObj, parentsObj } = defObjs();

        return () => {
            const relationships: Array<[Child, Parent]> = [];
            for (const child of Object.values(childrenObj)) {
                if (child.parentId in parentsObj) {
                    relationships.push([child, parentsObj[child.parentId]]);
                } else {
                    throw new Error("no parent found");
                }
            }
            return relationships;
        };
    }),

    add("cache func", () => {
        const { children, parents } = defArrays();

        return () => {
            const cachedFind = defCachedFind(parents);

            const relationships: Array<[Child, Parent]> = [];

            for (const child of children) {
                const parent = cachedFind(child.parentId);
                relationships.push([child, parent]);
            }

            return relationships;
        };
    }),

    add("cache func: map", () => {
        const { children, parents } = defArrays();

        return () => {
            const cachedFind = defCachedFindMap(parents);

            const relationships: Array<[Child, Parent]> = [];

            for (const child of children) {
                const parent = cachedFind(child.parentId);
                relationships.push([child, parent]);
            }

            return relationships;
        };
    }),

    add("array + object (cheating)", () => {
        const { children, parentsObj } = defObjs();

        return () => {
            const relationships: Array<[Child, Parent]> = [];
            for (const child of children) {
                if (child.parentId in parentsObj) {
                    relationships.push([child, parentsObj[child.parentId]]);
                } else {
                    throw new Error("no parent found");
                }
            }
            return relationships;
        };
    }),

    cycle(),

    complete(),

    save({ file: "bench", format: "chart.html" }),
);
