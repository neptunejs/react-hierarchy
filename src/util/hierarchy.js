// Traverse hierarchy, returning all nodes predicate return truthy for
// options: traverse until given depth
export function children(node, predicate, options) {
  const nodes = [node];
  const match = [];
  let children, i;
  while ((node = nodes.pop())) {
    children = node.children;
    const isMatch = predicate(node);
    if (children && shouldGoDeeper(node, options, isMatch)) {
      for (i = children.length - 1; i >= 0; --i) {
        nodes.push(children[i]);
      }
    }
    if (isMatch) {
      match.push(node);
    }

  }
  return match;
}

// truncate the tree by removing children of nodes
// for which the predicate returns truthy
export function truncate(node, predicate) {
  // beforeEach so that when the predicate is met
  // we don't traverse the removed children
  node = node.copy();
  node.eachBefore(function (node) {
    if (predicate(node)) {
      node.children = null;
    }
  });

  return node;
}


export function minimumChildren(node, minChildren) {
  const root = node.copy();
  root.sum(() => 1);
  root.eachBefore((node) => {
    if (node.value <= minChildren) {
      node.children = null;
    }
  });
  return root;
}

export const NODE_TYPES = {
  ROOT: 'ROOT',
  LEAF: 'LEAF',
  FAKE_ROOT: 'FAKEROOT',
  INTERMEDIATE: 'INTERMEDIATE'
};

export function getNodeType(node) {
  if (node.fakeRoot) {
    return NODE_TYPES.FAKE_ROOT;
  } else if (node.parent === null) {
    return NODE_TYPES.ROOT;
  } else if (!node.children || node.children.length === 0) {
    return NODE_TYPES.LEAF;
  } else {
    return NODE_TYPES.INTERMEDIATE;
  }
}


function shouldGoDeeper(node, options, isMatch) {
  if (options.depth !== undefined) {
    if (typeof options.depth === 'number') {
      return options.depth < node.depth || node.depth == null;
    } else if (options.depth === 'first') {
      return !isMatch;
    }
  }
  return true;
}
