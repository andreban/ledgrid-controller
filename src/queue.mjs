class QueueEntry {  
    constructor(data) {
      this.data = data;
      this.next = null;
    }
}

export class Queue {  
    constructor() {
        this.head = null;
        this.tail = null;
    }

    /**
     * Adds an item to the queue.
     * @param data
     */
    enqueue(data) {
      const newNode = new QueueEntry(data);
      if (this.tail) {
        this.tail.next = newNode;
      }
      this.tail = newNode;
  
      // Queue is empty. Initialise the head.
      if (!this.head) {
        this.head = this.tail;
      }
    }
  
    /**
     * Removes an item from the queue and returns it.
     * @returns {T} the removed item.
     * @throws an error if the list is empty.
     */
    dequeue() {
      if (this.isEmpty()) {
        throw new Error('Cannot dequeue. Queue is empty');
      }

      if (!this.head) {
        return null;
      }

      const node = this.head.data;

      if (this.head) {
        this.head = this.head.next;
      }
      
      return node;
    }
  
    /**
     * Checks if the Queues is empty
     * @returns {boolean} true if the Queue is empty.
     */
    isEmpty() {
      return this.head == null;
    }
  }


  /**
 * The AsyncBlockingQueue implements a queue with an asynchronous programming model. Items can
 * be added to the Queue as usual. When dequeing, a Promise is returned.
 *
 * The promise will resolve instantly if the Queue is not empty. If the Queue is empty, the Promise
 * will be resolved when a new item is added to the queue.
 */
export class AsyncBlockingQueue {
    constructor() {
        this.promiseQueue = new Queue();
        this.resolverQueue = new Queue();
    }

    add() {
      const promise = new Promise(resolve => {
        this.resolverQueue.enqueue(resolve);
      });
      this.promiseQueue.enqueue(promise);
    }
  
    /**
     * Enqueues an item
     * @param data
     */
    enqueue(data) {
      if (this.resolverQueue.isEmpty()) {
        this.add();
      }
      const resolve = this.resolverQueue.dequeue();
      resolve(data);
    }
  
    /**
     * Asynchronously dequeues an item. If the queue is empty, the returned Promise is resolved when
     * an item is added. Otherwise, it will return one o the existing items.
     * @returns {Promise<T>} that resolves to the data.
     */
    async dequeue() {
      if (this.promiseQueue.isEmpty()) {
        this.add();
      }
      return this.promiseQueue.dequeue();
    }
  
    hasPendingPromises() {
      return !this.promiseQueue.isEmpty();
    }
  
    hasPendingResolvers() {
      return !this.resolverQueue.isEmpty();
    }
  }
