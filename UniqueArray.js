class UniqueArray {
    constructor(property) {
        this.property = property;
        this.map = new Map();
        this.array = [];
    }

    add(item) {
        const key = item[this.property];
        if (!this.map.has(key)) {
            this.map.set(key, item);
            this.array.push(item);
        }
    }

    getArray() {
        return this.array;
    }

    get(key) {
        return this.map.get(key);
    }
}

// 示例用法
//   const uniqueArray = new UniqueArray('id');

//   uniqueArray.add({ id: 1, name: 'Alice' });
//   uniqueArray.add({ id: 2, name: 'Bob' });
//   uniqueArray.add({ id: 1, name: 'Alice' });
//   uniqueArray.add({ id: 3, name: 'Charlie' });

//   const result = uniqueArray.getArray();
//   console.log(result);
// 输出: [ { id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Charlie' } ]

module.exports = UniqueArray;