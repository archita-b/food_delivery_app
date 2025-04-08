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

export class KitchenQuadTree {
  constructor(nodes = []) {
    if (!Array.isArray(nodes) || !nodes.length) {
      throw new Error("Quad tree must be initialized with at least one node.");
    }

    const latitudes = nodes.map((node) => node.position.latitude);
    const longitudes = nodes.map((node) => node.position.longitude);

    const topLeft = new Point(Math.max(...latitudes), Math.min(...longitudes));
    const bottomRight = new Point(
      Math.min(...latitudes),
      Math.max(...longitudes)
    );

    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
    this.midPoint = new Point(
      (this.topLeft.latitude + this.bottomRight.latitude) / 2,
      (this.topLeft.longitude + this.bottomRight.longitude) / 2
    );
    this.subTrees = {
      topLeft: null,
      topRight: null,
      bottomLeft: null,
      bottomRight: null,
    };

    this.#insert(nodes);
  }

  #insert(nodes) {
    nodes = Array.isArray(nodes) ? nodes : [nodes];

    for (const node of nodes) {
      const quadrant = this.getQuadrant(node);

      if (this.subTrees[quadrant] == null) {
        this.subTrees[quadrant] = node;
      } else if (this.subTrees[quadrant] instanceof Node) {
        const existingNode = this.subTrees[quadrant];
        this.subTrees[quadrant] = new KitchenQuadTree([existingNode, node]);
      } else {
        this.subTrees[quadrant].insert(node);
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
        candidates.push({ node: quadrant, distance: distance });
      } else if (quadrant instanceof KitchenQuadTree) {
        yield* quadrant.findNearest(point);
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    for (const { node } of candidates) {
      yield node;
    }
  }
}
