/**
 * Schema tree utilities for building, flattening, searching, and navigating schema trees.
 */

import { PATH_SEPARATOR } from "./internal-path.utils.js";
import { removeAccents } from "./remove-accents.js";

// Type definitions
export type JsonPrimitive = string | number | boolean | null;

// We don't currently support arrays, as arrays are always represented as
// 'array', but could in the future
export interface JsonObject {
  [key: string]: JsonPrimitive | JsonObject;
}

export type SchemaNodeType = "primitive" | "object" | "array";

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

interface SchemaNodeSharedProperties {
  key: string;
  type: SchemaNodeType;
  path: string;
  parent?: string;
}

export type SchemaNode = SchemaNodeSharedProperties &
  (
    | {
        type: Extract<SchemaNodeType, "object">;
        children: SchemaNode[];
        value?: never;
      }
    | {
        type: Extract<SchemaNodeType, "array">;
        children?: SchemaNode[];
        value?: never;
      }
    | {
        type: Extract<SchemaNodeType, "primitive">;
        value: JsonPrimitive;
        children?: never;
      }
  );

// Tree building and manipulation functions

export function buildSchemaTree(
  data: JsonObject,
  parentPath?: string,
): { nodes: SchemaNode[]; nodeMap: Map<string, SchemaNode> } {
  const nodes: SchemaNode[] = [];
  const nodeMap = new Map<string, SchemaNode>();

  for (const key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      continue;
    }

    const value = data[key];
    if (value === undefined) {
      continue;
    }

    const path = parentPath ? `${parentPath}${PATH_SEPARATOR}${key}` : key;
    if (Array.isArray(value)) {
      // Arrays not yet supported
      continue;
    } else if (isJsonObject(value)) {
      // Handle objects - recursively build children
      const childResult = buildSchemaTree(value, path);
      const node: SchemaNode = {
        key,
        type: "object",
        path,
        parent: parentPath,
        children: childResult.nodes,
      };
      nodes.push(node);
      nodeMap.set(path, node);

      // Merge child nodeMap into parent nodeMap
      childResult.nodeMap.forEach((childNode, childPath) => {
        nodeMap.set(childPath, childNode);
      });
    } else {
      // Handle primitives
      const node: SchemaNode = {
        key,
        type: "primitive",
        value,
        path,
        parent: parentPath,
      };
      nodes.push(node);
      nodeMap.set(path, node);
    }
  }

  return { nodes, nodeMap };
}

export const flattenSchemaTree = (items: SchemaNode[]): SchemaNode[] =>
  items.flatMap((item) => [
    item,
    ...("children" in item && item.children ? flattenSchemaTree(item.children) : []),
  ]);

export function searchSchemaTree(
  searchValue: string,
  flattenedSchemaTree: SchemaNode[],
  nodeMap: Map<string, SchemaNode>,
) {
  if (!searchValue) {
    return flattenedSchemaTree;
  }

  const cleanedSearchValue = removeAccents(searchValue.toLowerCase());
  const matcher = (item: SchemaNode) =>
    removeAccents(item.key.toLowerCase()).includes(cleanedSearchValue);

  // Pass 1: Find direct matches - O(n)
  const directMatches = new Set<string>();
  for (const item of flattenedSchemaTree) {
    if (matcher(item)) {
      directMatches.add(item.path);
    }
  }

  // Pass 2: Add ancestors and descendants - O(n) with nodeMap
  const allMatches = new Set<string>(directMatches);
  for (const matchPath of directMatches) {
    const item = nodeMap.get(matchPath);
    if (!item) {
      continue;
    }

    // Add ancestors using O(1) parent lookups
    let current = item.parent;
    while (current) {
      allMatches.add(current);
      const node = nodeMap.get(current);
      current = node?.parent;
    }

    // Add descendants recursively
    const addDescendants = (node: SchemaNode) => {
      if (node.children) {
        for (const child of node.children) {
          allMatches.add(child.path);
          addDescendants(child);
        }
      }
    };

    addDescendants(item);
  }

  return flattenedSchemaTree.filter((item) => allMatches.has(item.path));
}

// Tree navigation helper functions

export function getParentNode(
  item: SchemaNode,
  nodeMap: Map<string, SchemaNode>,
): SchemaNode | undefined {
  if (!item.parent) {
    return;
  }

  return nodeMap.get(item.parent);
}

export function getAncestors(item: SchemaNode, nodeMap: Map<string, SchemaNode>): SchemaNode[] {
  const parent = getParentNode(item, nodeMap);
  if (!parent) {
    return [];
  }

  return [parent, ...getAncestors(parent, nodeMap)];
}

export function getDescendants(item: SchemaNode, nodeMap: Map<string, SchemaNode>): SchemaNode[] {
  if (!item.children) {
    return [];
  }

  // Get direct descendants from children array
  return item.children.flatMap((child) => [child, ...getDescendants(child, nodeMap)]);
}
