/**
 * Returns a list of nodes that can be in the tab sequence.
 * @see: https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker
 */
export function getTabbableNodes(container: HTMLElement) {
  const nodes: HTMLElement[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node: HTMLElement) =>
      // `.tabIndex` is not the same as the `tabindex` attribute. It works on the
      // runtime's understanding of tabbability, so this automatically accounts
      // for any kind of element that could be tabbed to.
      node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
  });
  while (walker.nextNode()) {
    if (walker.currentNode instanceof HTMLElement) {
      nodes.push(walker.currentNode);
    }
  }

  return nodes;
}
