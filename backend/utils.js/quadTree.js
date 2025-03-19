import { calculateDistance } from "./distance.js";

export class Point {
  constructor(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }
}

export class Node {
  constructor(id, latitude, longitude, openingTime, closingTime) {
    this.id = id;
    this.position = new Point(latitude, longitude);
    this.openingTime = openingTime;
    this.closingTime = closingTime;
  }
}

export class quadTree {
  constructor(topLeft, bottomRight) {
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
  }

  insert(items) {
    if (!items) return;

    if (Array.isArray(items)) {
      for (const item of items) {
        this.insert(item);
      }
      return;
    }

    const node = items;
    const quadrant = this.getQuadrant(node);

    if (this.subTrees[quadrant] == null) {
      this.subTrees[quadrant] = new Node(
        node.id,
        node.position.latitude,
        node.position.longitude,
        node.openingTime,
        node.closingTime
      );
      return;
    }

    if (this.subTrees[quadrant] instanceof Node) {
      const existingNode = this.subTrees[quadrant];
      const [topLeft, bottomRight] = this.getBoundaryForQuadrant(quadrant);
      this.subTrees[quadrant] = new quadTree(topLeft, bottomRight);
      this.subTrees[quadrant].insert(existingNode);
      this.subTrees[quadrant].insert(node);
      return;
    }

    if (this.subTrees[quadrant] instanceof quadTree) {
      this.subTrees[quadrant].insert(node);
    }
  }

  getQuadrant(node) {
    if (node.position.latitude <= this.midPoint.latitude) {
      if (node.position.longitude <= this.midPoint.longitude) return "topLeft";
      return "topRight";
    }
    if (node.position.longitude <= this.midPoint.longitude) return "bottomLeft";
    return "bottomRight";
  }

  getBoundaryForQuadrant(quadrant) {
    switch (quadrant) {
      case "topLeft":
        return [this.topLeft, this.midPoint];
      case "bottomLeft":
        return [
          new Point(this.topLeft.latitude, this.midPoint.longitude),
          new Point(this.midPoint.latitude, this.bottomRight.longitude),
        ];
      case "topRight":
        return [
          new Point(this.midPoint.latitude, this.topLeft.longitude),
          new Point(this.bottomRight.latitude, this.midPoint.longitude),
        ];
      case "bottomRight":
        return [this.midPoint, this.bottomRight];
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
      } else if (quadrant instanceof quadTree) {
        yield* quadrant.findNearest(point);
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    for (const { node } of candidates) {
      yield node;
    }
  }
}
