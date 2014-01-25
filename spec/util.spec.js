describe("Heap Operations", function() {

    var Heap;

    var tHeap;

    var basicIntComparator = function(a, b) {
        if (a > b) {
            return 1;
        } else if (b > a) {
            return -1;
        } else {
            return 0;
        }
    };

    beforeEach(function(done) {
        require(['lib/rpg.util'], function(util) {
            Heap = util.Heap;
            tHeap = new Heap(basicIntComparator);
            tHeap.insert(6)
                .insert(2)
                .insert(8)
                .insert(5)
                .insert(20)
                .insert(26)
                .insert(3)
                .insert(7);
            done();
        });
    });

    it("should know if it is empty", function() {
        var heap = new Heap();
        expect(heap.empty()).toBe(true);
    });

    it("should return the smallest values based on the comparator", function() {
        expect(tHeap.min()).toBe(2);
    });

    it("should insert and reorder nodes so min is first", function() {
        tHeap.insert(1);
        expect(tHeap.pop()).toBe(1);
    });
    it("should return smallest even after pop", function() {
        expect(tHeap.pop()).toBe(2);
        expect(tHeap.pop()).toBe(3);
        expect(tHeap.pop()).toBe(5);
        expect(tHeap.pop()).toBe(6);
        expect(tHeap.pop()).toBe(7);
        expect(tHeap.pop()).toBe(8);
        expect(tHeap.pop()).toBe(20);
    });
});


describe("Circular List Operations", function() {

    var CircularList;

    var tList;

    beforeEach(function(done) {
        require(['lib/rpg.util'], function(util) {
            CircularList = util.CircularList;
            tList = new CircularList([2, 5, 7])
            done();
        });
    });

    it("should know if list is empty", function() {
        var list = new CircularList();
        expect(list.isEmpty()).toBe(true);
    });

    it("should know how to count", function() {
        expect(tList.count()).toBe(3);
    });

    it("should know if list is not empty", function() {
        expect(tList.isEmpty()).toBe(false);
    });

    it("should be able to get an item in the list by index", function() {
        expect(tList.get(2)).toBe(7);
    });

    it("should be able to get an item in the list by index", function() {
        expect(tList.get(2)).toBe(7);
    });

    it("should return undefined if getting an value at an unknown index", function() {
        expect(tList.get(3)).toBe(undefined);
    });

    it("should be able to add an item to the end of the list", function() {
        tList.add(8);
        expect(tList.get(3)).toBe(8);
    });

    it("should be able to add an item to the end of the list", function() {
        tList.add(8);
        expect(tList.get(3)).toBe(8);
    });

    it("should shallow clone the array if retrieving array form", function() {
        var aList = tList.asArray();
        aList[0] = 20;
        expect(tList.get(0)).toBe(2);
    });

    it("should remove a value by from list by value", function() {
        tList.remove(5)
        expect(tList.get(5)).toBe(undefined);
        expect(tList.count()).toBe(2);
    });

    it("should not remove anything if value does not exist", function() {
        tList.remove(3)
        expect(tList.count()).toBe(3);
    });

    it("should move to the next item", function() {
        tList.next()
        expect(tList.getCurrent()).toBe(5);
    });

    it("should loop to the head node if at the end", function() {
        tList.next();
        tList.next();
        tList.next();
        expect(tList.getCurrent()).toBe(2);
    });

    it("should move to the prev item", function() {
        tList.prev();
        expect(tList.getCurrent()).toBe(7);
    });

    it("should reset iterator to the beginning", function() {
        tList.prev();
        tList.reset();
        expect(tList.getCurrent()).toBe(2);
    });

    it("should be able to tell if we reached the last node", function() {
        tList.next();
        tList.next();
        expect(tList.isLast()).toBe(true);
    });

    it("should be able to get index of value", function() {
        expect(tList.indexOf(5)).toBe(1);
    });

    it("should be able filter nodes in list", function() {
        var list = new CircularList([1, 20, 5, 3, 50, 12]);
        var fList = list.filter(function(value) {
            if (value < 12) {
                return true;
            } else {
                return false;
            }
        });
        expect(fList.count()).toBe(3);
        expect(fList).toContain(3)
        expect(fList).not.toContain(12);
    });
});