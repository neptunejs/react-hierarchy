// Traverse hierarchy, returning all nodes predicate return truthy for
// options: traverse until given depth
export function children(node, predicate, options) {
    const nodes = [node], match = [];
    let children, i;
    while (node = nodes.pop()) {
        children = node.children;
        const isMatch = predicate(node);
        if (children && shouldGoDeeper(node, options, isMatch)) for (i = children.length - 1; i >= 0; --i) {
            nodes.push(children[i]);
        }
        if(isMatch) {
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
    node.eachBefore(function (node) {
        if (predicate(node)) {
            if (node.children && !node._children)
                node._children = node.children;
            node.children = null;
        }
    });
}

// Restores children removed with truncate
export function untruncate(node) {
    const children = module.exports.children(node, node => node._children && !node.children, {
        depth: 'first'
    });
    children.forEach(function (node) {
        node.children = node._children;
        node._children = null;
    });
    return children;
}

function shouldGoDeeper(node, options, isMatch) {
    if(options.depth !== undefined) {
        if(typeof options.depth === 'number') {
            return options.depth < node.depth || node.depth == null;
        } else if(options.depth === 'first') {
            return !isMatch;
        }
    }
    return true;
}
