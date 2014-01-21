define(function() {

    // Constants for key controls.
    var Control = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        ENTER: 13
    };


    // Functions to load data from specific file types into an object.
    var dataLoaders = {
        png: function(datastore, filename, onload) {
            var image = new Image();
            image.src = filename;
            image.onload = function() {
                datastore[filename] = image;
                onload();
            };
        },
        json: function(datastore, filename, onload) {
            $.getJSON(filename, function(data) {
                datastore[filename] = data;
                onload();
            });
        }
    };


    // Simple datastore/cache that loads images and JSON files synchronously.
    var Datastore = function(customDataLoaders) {
        this._dataLoaders = customDataLoaders || dataLoaders;
        this._data = {};
    }

    // Loads and caches assets.
    Datastore.prototype.load = function(assets, callback, dataLoaders) {
        var self = this;
        dataLoaders = dataLoaders || this._dataLoaders;
        for (var key in assets) {
            if (this._data[assets[key]] === undefined) {
                this._data[assets[key]] = null;
            }
        }

        var allAssetsLoaded = true;
        for (var key in assets) {
            var type = assets[key].substring(assets[key].lastIndexOf('.') + 1);
            if (this._data[assets[key]] === null && dataLoaders[type]) {
                allAssetsLoaded = false;
                dataLoaders[type](this._data, assets[key], function() {
                    self._onload(callback);
                });
            }
        }
        self._onload(callback);
    };

    // Once data stores finishes loading data, execute user callback
    // If data is not completely loaded, then callback will not be
    // executed. This is for when multiple assets are loaded.
    //
    // TODO(richard-to): What's the point of local data object?
    Datastore.prototype._onload = function(callback) {
        var data = {};
        for (key in this._data) {
            if (this._data[key] === null) {
                return false;
            } else {
                data[key] = this._data[key];
            }
        }

        if (callback) {
            callback();
        }
    };

    // Gets an assets in the data store.
    Datastore.prototype.get = function(key) {
        return this._data[key];
    };


    // Screen information is calculated using a grid.
    var Screen = function(tileSize, gridWidth, gridHeight) {
        this.tileSize = tileSize;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.width = tileSize * gridWidth;
        this.height = tileSize * gridHeight;

        this.gridMidWidth = Math.floor(this.gridWidth / 2);
        if (this.gridWidth % 2 == 0) {
            this.gridMidWidth -= 1;
        }
        this.gridRemWidth = this.gridWidth - this.gridMidWidth;

        this.gridMidHeight = Math.floor(this.gridHeight / 2);
        if (this.gridHeight % 2 == 0) {
            this.gridMidHeight -= 1;
        }
        this.gridRemHeight = this.gridHeight - this.gridMidHeight;
    };


    // Circular list implementation useful for iterating through
    // entities in circular fashion
    //
    // Arrays are shallow copied for now.
    var CircularList = function(list) {
        this._index = 0;
        this._list = (list) ? list.slice(0) : [];
    };

    // Rreturn the circular list as an array.
    // Technically you could access it as myCircleList.list
    CircularList.prototype.asArray = function () {
        return this._list;
    }

    // Get the item as specific index.
    // This will not reset the internal pointer
    // to the current item in the list.
    CircularList.prototype.get = function(index) {
        return this._list[index];
    };

    // Adds an item to the end of the list
    CircularList.prototype.add = function(value) {
        this._list.push(value);
        return this;
    };

    // Removes an items from the list if it exists.
    // Normally when an item is removed, the pointer
    // will be to the next item in the last unless
    // we are pointing to the last item. In this case,
    // the pointer will be reset to the begininning.
    CircularList.prototype.remove = function(value) {
        var index = -1;
        for (var i = 0; i < this._list.length; i++) {
            if (value == this._list[i]) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            this._list.splice(index, 1);
        }

        if (this._index == this._list.length) {
            this._index = 0;
        }
        return this;
    };

    // Move the pointer based on specified value.
    // If not value found, then the index pointer is not
    // changed.
    CircularList.prototype.setCurrent = function(value) {
        for (var i = 0; i < this._list.length; i++) {
            if (value == this._list[i]) {
                this._index = i;
                break;
            }
        }
        return this;
    };


    // Creates a new circular list based on user defined callback
    // that determines what items to keep
    CircularList.prototype.filter = function(callback) {
        var newList = [];
        for (var i = 0; i < this._list.length; i++) {
            if (callback(this._list[i])) {
                newList.push(this._list[i]);
            }
        }
        return new CircularList(newList);
    };

    // Resets the pointer of the circular list
    CircularList.prototype.reset = function() {
        this._index = 0;
    };

    // Gets the number of items in the list
    CircularList.prototype.count = function() {
        return this._list.length;
    };

    // Checks if list is empty
    CircularList.prototype.isEmpty = function() {
        return (this._list.length == 0);
    };

    // Moves pointer to next item
    // Return the item that was being pointed previously
    // Not sure if this is a good. Seems kind of confusing..
    CircularList.prototype.next = function() {
        if (this.isEmpty()) {
            return null;
        }
        var value = this._list[this._index];
        this._index = (this._index + 1) % this._list.length;
        return value;
    };

    // Moves pointer to prev item
    // Return the item that was being pointed previously
    CircularList.prototype.prev = function() {
        if (this.isEmpty()) {
            return null;
        }
        var value = this._list[this._index];

        this._index = this._index - 1;
        this._index = (this._index < 0) ? this._list.length - 1 : this._index;
        return value;
    };

    // Picks a random element from the list. Does not affect
    // the pointer.
    CircularList.prototype.getRandom = function() {
        if (this.isEmpty()) {
            return null;
        }
        var index = Math.floor(Math.random() * this._list.length);
        return this._list[index];
    };

    // Gets the element that the current is pointing to currently
    CircularList.prototype.getCurrent = function() {
        if (this.isEmpty()) {
            return null;
        }
        return this._list[this._index];
    };

    // Checks if we are the last element. Useful if we need
    // to stop the loop at the end of the list
    CircularList.prototype.isLast = function() {
        return (this._index == this._list.length - 1);
    };



    // Basic heap implementation
    //
    // This does not include a method to
    // to build a heap from an unordered array
    // and does not allow removal of specific items.
    //
    // Only implements insert, peek, pop, and empty,
    // which is good enough for what I need here.
    //
    // This implementation requires a compare function used
    // for ordering objects. Return 1 for greter than, 0 for equals
    // and -1 for less than.
    var Heap = function(compare) {
        this._compare = compare;
        this._heap = [];
    };

    Heap.prototype.empty = function() {
        return this._heap.length == 0;
    };

    Heap.prototype.insert = function(obj) {
        this._heap.push(obj);
        this._percolateUp(this._heap.length);
    };

    Heap.prototype.min = function() {
        return this._heap[0];
    };

    Heap.prototype.pop = function() {
        if (this.empty()) {
            return null;
        } else if (this._heap.length == 1) {
            return this._heap.pop();
        } else {
            var min = this._heap[0];
            this._heap[0] = this._heap.pop();
            this._percolateDown(0);
            return min;
        }
    };

    Heap.prototype._percolateUp = function(hole) {
        if (hole > 0) {
            var parent = null;
            if (hole % 2 == 0) {
                parent = (hole - 1) / 2;
            } else {
                parent = hole / 2;
            }
            if (parent < this._heap.length &&
                hole < this._heap.length &&
                this._compare(this._heap[hole], this._heap[parent]) > 0)  {

                var temp = this._heap[parent];
                this._heap[parent] = this._heap[hole];
                this._heap[hole] = temp;
                this._percolateUp(parent);
            }
        }
    };

    Heap.prototype._percolateDown = function(hole) {
        parent = this._heap[hole];
        child1 = 2 * hole + 1;
        child2 = child1 + 1;
        if (child1 < this._heap.length &&
            (child2 >= this._heap.length || this._compare(this._heap[child1], this._heap[child2]) < 0) &&
            this._compare(parent, this._heap[child1]) > 0) {
            this._heap[hole] = this._heap[child1];
            this._heap[child1] = parent;
            this._percolateDown(child1);
        } else if (child2 < this._heap.length && this._compare(parent, this._heap[child2]) > 0) {
            this._heap[hole] = this._heap[child2];
            this._heap[child2] = parent;
            this._percolateDown(child2);
        }
    };


    // Priority Queue object that wraps heap data structure
    var PriorityQueue = function(compare) {
        this._heap = new Heap(compare);
    };

    PriorityQueue.prototype.empty = function() {
        return this._heap.empty();
    }

    PriorityQueue.prototype.insert = function(obj) {
        this._heap.insert(obj);
    };

    PriorityQueue.prototype.peek = function() {
        return this._heap.min();
    }

    PriorityQueue.prototype.remove = function() {
        return this._heap.pop();
    };


    // Should be named better, but currently used
    // for relating entities with their sprite representations
    //
    // This is designed to only work for entities as the key. But
    // technically this could be overriden by adding a key parameter
    // to any object.
    //
    // Any value can be used for the value parameter.
    EntityHashTable = function(table) {
        this._table = table || {};
    };

    // Add multiple items to table. In this case, need to use two arrays
    // where corresponding indexes are related.
    //
    // For example entityList[0] and valueList[0] are pairs.
    //
    // Not ideal...but works for now
    EntityHashTable.prototype.addFromArrays = function(entityList, valueList) {
        for (var i = 0; i < entityList.length; i++) {
            this.add(entityList[i], valueList[i]);
        }
        return this;
    };

    // Adds new entity and value pair to table. If entity exists
    // then, values will be overwritten
    EntityHashTable.prototype.add = function(entity, value) {
        this._table[entity.key] = value;
        return this;
    };

    // Gets a value by entity.
    // TODO(richard-to): What happens when an entity doesn't exist?
    //                   I think undefined?
    EntityHashTable.prototype.get = function(entity) {
        return this._table[entity.key];
    };


    return {
        Control: Control,
        Screen: Screen,
        dataLoaders: dataLoaders,
        Datastore: Datastore,
        CircularList: CircularList,
        Heap: Heap,
        PriorityQueue: PriorityQueue,
        EntityHashTable: EntityHashTable
    };
});