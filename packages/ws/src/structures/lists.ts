/**
 * abstract node lol
 */
export interface AbstractNode<T> {
  data: T;
  next: this | null;
}

export interface QueuePusher<T> {
  push(data: T): NonNullable<TNode<T>>;
}

export interface QueuePusherWithPriority<T> {
  push(data: T, priority: number): NonNullable<PNode<T>>;
}

export class TNode<T> implements AbstractNode<T> {
  data: T;
  next: this | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }

  static null<T>(list: AbstractNode<T> | null): list is null {
    return !list;
  }
}

export class PNode<T> extends TNode<T> {
  priority: number;

  constructor(data: T, priority: number) {
    super(data);
    this.priority = priority;
  }
}

export abstract class Queue<T> {
  protected abstract head: AbstractNode<T> | null;

  /**
   * O(1)
   */
  public pop() {
    if (TNode.null(this.head)) {
      throw new Error("cannot pop a list without elements");
    }

    return (this.head = this.head.next);
  }

  /**
   * O(1)
   */
  public peek(): T {
    if (TNode.null(this.head)) {
      throw new Error("cannot peek an empty list");
    }

    return this.head.data;
  }

  /**
   * O(n)
   */
  public size(): number {
    let aux = this.head;

    if (TNode.null(aux)) {
      return 0;
    }

    let count = 1;

    while (aux.next !== null) {
      count++;
      aux = aux.next;
    }

    return count;
  }

  /**
   * O(1)
   */
  public isEmpty() {
    return TNode.null(this.head);
  }

  *[Symbol.iterator](): IterableIterator<T> {
    let temp = this.head;
    while (temp !== null) {
      yield temp.data;
      temp = temp.next;
    }
  }

  public toArray(): T[] {
    return Array.from(this);
  }
  public toString() {
    return this.head?.toString() || "";
  }
}

export class LinkedList<T> extends Queue<T> implements QueuePusher<T> {
  protected head: TNode<T> | null = null;

  /**
   * O(1)
   */
  public push(data: T): NonNullable<TNode<T>> {
    const temp = new TNode<T>(data);
    temp.next = this.head;
    this.head = temp;

    return this.head;
  }
}

export class PriorityQueue<T> extends Queue<T> implements QueuePusherWithPriority<T> {
  protected head: PNode<T> | null = null;

  /**
   * O(#priorities)
   */
  public push(data: T, priority: number): NonNullable<PNode<T>> {
    let start = this.head;
    const temp = new PNode(data, priority);

    if (TNode.null(this.head) || TNode.null(start)) {
      this.head = temp;
      return this.head;
    }

    if (this.head.priority > priority) {
      temp.next = this.head;
      this.head = temp;
      return this.head;
    }

    while (start.next !== null && start.next.priority < priority) {
      start = start.next;
    }

    temp.next = start.next as PNode<T>;
    start.next = temp;

    return this.head;
  }
}
