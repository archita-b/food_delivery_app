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

class BaseQuadTree {
  constructor(topLeft, bottomRight) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
    this.root = null;
    this.subTrees = {
      topLeft: null,
      bottomLeft: null,
      topRight: null,
      bottomRight: null,
    };
    this.totalNodes = 0;
    this.deletedCount = 0;
  }

  insert(item) {
    if (!item || item.deleted) return;

    if (this.root == null) {
      this.root = new Node(
        item.id,
        item.position.latitude,
        item.position.longitude
      );
      this.totalNodes++;
      return;
    }

    const quadrant = this.getQuadrant(item);
    if (this.subTrees[quadrant] == null) {
      const [topLeft, bottomRight] = this.getBoundaryForQuadrant(quadrant);
      this.subTrees[quadrant] = new SubQuadTree(topLeft, bottomRight);
    }

    this.subTrees[quadrant].insert(item);
    this.totalNodes++;
  }

  remove(item) {
    if (!item) return;

    if (this.root && this.root.id === item.id) {
      this.root.deleted = true;
      this.deletedCount++;
      return;
    }

    const quadrant = this.getQuadrant(item);
    if (this.subTrees[quadrant]) {
      this.subTrees[quadrant].remove(item);
    }
  }

  collectLiveNodes(node) {
    const results = [];
    if (!node || node.deleted) return;

    results.push(node);

    for (const quadrant in this.subTrees) {
      const subTree = this.subTrees[quadrant];
      if (subTree) {
        results.push([...subTree.collectLiveNodes(subTree.root)]);
      }
    }
    return results;
  }

  getQuadrant(item) {
    if (item.position.latitude >= this.root.position.latitude) {
      if (item.position.longitude <= this.root.position.longitude)
        return "topLeft";
      return "topRight";
    } else {
      if (item.position.longitude <= this.root.position.longitude)
        return "bottomLeft";
      return "bottomRight";
    }
  }

  getBoundaryForQuadrant(quadrant) {
    switch (quadrant) {
      case "topLeft":
        return [this.topLeft, this.root];
      case "bottomLeft":
        return [
          new Point(this.root.position.latitude, this.topLeft.longitude),
          new Point(this.bottomRight.latitude, this.root.position.longitude),
        ];
      case "topRight":
        return [
          new Point(this.topLeft.latitude, this.root.position.longitude),
          new Point(this.root.position.latitude, this.bottomRight.longitude),
        ];
      case "bottomRight":
        return [this.root, this.bottomRight];
    }
  }
}

export class GeoSpatialQuadTree extends BaseQuadTree {
  constructor(items = []) {
    if (!Array.isArray(items) || !items.length) {
      throw new Error(
        "GeoSpatialQuadTree tree must be initialized with at least one node."
      );
    }

    super(new Point(90, -90), new Point(0, 180));
    this.items = new Map();

    for (const item of items) {
      this.items.set(item.id, item);
      this.insert(item);
    }
  }

  update(item, newLat, newLon) {
    if (!item || !this.items.has(item.id)) return;

    const oldItem = this.items.get(item.id);
    this.remove(oldItem);

    this.items.set(item.id, item);

    item.position.latitude = newLat;
    item.position.longitude = newLon;
    item.deleted = false;

    this.insert(item);
  }

  rebuildSubTree() {
    const subTree = this.subTrees[quadrant];
    if (!subTree) return;

    const liveNodes = this.collectLiveNodes(subTree.root);
    const deletedRatio = subTree.deletedCount / subTree.totalNodes;

    if (deletedRatio > 0.2) {
      this.subTrees[quadrant] = new SubQuadTree(
        subTree.topLeft,
        subTree.bottomRight
      );

      for (const node of liveNodes) {
        this.subTrees[quadrant].insert(node);
      }
    }
  }

  *findNearest(point) {
    const queue = [];

    if (this.root && !this.root.deleted) {
      const distanceToRoot = calculateDistance(
        point.latitude,
        point.longitude,
        this.root.latitude,
        this.root.longitude
      );
      queue.push({ node: this.root, distance: distanceToRoot });
    }

    for (const quadrant in this.subTrees) {
      const subTree = this.subTrees[quadrant];
      if (subTree && subTree.root && !subTree.root.deleted) {
        const distance = calculateDistance(
          point.latitude,
          point.longitude,
          subTree.root.position.latitude,
          subTree.root.position.longitude
        );
        queue.push({ node: subTree.root, distance: distance });
      }
    }

    queue.sort((a, b) => a.distance - b.distance);

    for (const { node } of queue) {
      yield node;
    }
  }
}

class SubQuadTree extends BaseQuadTree {
  constructor(topLeft, bottomRight) {
    super(topLeft, bottomRight);
  }
}
