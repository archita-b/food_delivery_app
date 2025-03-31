import { calculateDistance } from "./distance.js";

export class Point {
  constructor(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }
}

export class Node {
  constructor(id, latitude, longitude) {
    this.id = id;
    this.position = new Point(latitude, longitude);
  }
}

export class DriverQuadTree {
  constructor(items = []) {
    if (!Array.isArray(items) || !items.length) {
      throw new Error("Quad tree must be initialized with at least one node.");
    }

    this.items = new Map();
    this.subTrees = {
      topLeft: null,
      topRight: null,
      bottomLeft: null,
      bottomRight: null,
    };

    this.updateBoundaries(items);
    this.#insert(items);
  }

  updateBoundaries(items) {
    const latitudes = items.map((item) => item.position.latitude);
    const longitudes = items.map((item) => item.position.longitude);

    this.topLeft = new Point(Math.max(...latitudes), Math.min(...longitudes));
    this.bottomRight = new Point(
      Math.min(...latitudes),
      Math.max(...longitudes)
    );
    this.midPoint = new Point(
      (this.topLeft.latitude + this.bottomRight.latitude) / 2,
      (this.topLeft.longitude + this.bottomRight.longitude) / 2
    );
  }

  #insert(items) {
    items = Array.isArray(items) ? items : [items];

    for (const item of items) {
      this.items.set(item.id, item);

      const quadrant = this.getQuadrant(item);
      if (this.subTrees[quadrant] == null) {
        this.subTrees[quadrant] = item;
      } else if (this.subTrees[quadrant] instanceof Node) {
        const existingItem = this.subTrees[quadrant];
        this.subTrees[quadrant] = new DriverQuadTree([item, existingItem]);
      } else {
        this.subTrees[quadrant].insert(item);
      }
    }
  }

  getQuadrant(node) {
    if (node.position.latitude > this.midPoint.latitude) {
      if (node.position.longitude <= this.midPoint.longitude) return "topLeft";
      return "topRight";
    } else {
      if (node.position.longitude <= this.midPoint.longitude)
        return "bottomLeft";
      return "bottomRight";
    }
  }

  update(itemId, newLocation) {
    const item = this.items.get(itemId);

    if (
      newLocation.latitude > this.topLeft.latitude ||
      newLocation.latitude < this.bottomRight.latitude ||
      newLocation.longitude < this.topLeft.longitude ||
      newLocation.longitude > this.bottomRight.longitude
    ) {
      this.updateBoundaries([...this.items.values()]);
    }

    this.items.delete(itemId);
    this.#insert(item);
  }

  remove(itemId) {
    if (this.items.has(itemId)) {
      this.items.delete(itemId);
      this.updateBoundaries([...this.items.values()]);
    }
  }

  *findNearest(point) {
    const candidates = [];

    for (const quadrant of Object.values(this.subTrees)) {
      if (quadrant instanceof Node) {
        const distance = calculateDistance(
          point.latitude,
          point.longitude,
          quadrant.position.latitude,
          quadrant.position.longitude
        );
        candidates.push({ node: quadrant, distance });
      } else if (quadrant instanceof DriverQuadTree) {
        yield* quadrant.findNearest(point);
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    for (const { node } of candidates) {
      yield node;
    }
  }
}
