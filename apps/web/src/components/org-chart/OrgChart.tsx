"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnNodeDrag,
} from "@xyflow/react";
import { Bot, Briefcase, Building2, Moon, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  KIND_LABEL,
  orgNodes,
  type ChangeRequest,
  type OrgKind,
} from "./org-data";
import { ChangeProposal } from "./ChangeProposal";
import { NodeDrawer } from "./NodeDrawer";

const NODE_WIDTH = 208;
const NODE_HEIGHT = 72;
const LEVEL_HEIGHT = 160;
const H_GAP = 48;

type OrgNodeData = {
  label: string;
  kind: OrgKind;
  role?: string;
  taskCount?: number;
  skillCount?: number;
  parentId: string | null;
  [key: string]: unknown;
};

type OrgFlowNode = Node<OrgNodeData, "org">;

const KIND_ICON: Record<OrgKind, LucideIcon> = {
  dream: Moon,
  manager: Briefcase,
  dept: Building2,
  human: User,
  agent: Bot,
};

const MINIMAP_COLORS: Record<OrgKind, string> = {
  dream: "#8b5cf6",
  manager: "#52525b",
  dept: "#a1a1aa",
  human: "#0ea5e9",
  agent: "#10b981",
};

function OrgNodeCard({ data, selected }: NodeProps<OrgFlowNode>) {
  const Icon = KIND_ICON[data.kind];
  const kindLabel = KIND_LABEL[data.kind];
  const isLeaf = data.kind === "human" || data.kind === "agent";

  return (
    <div
      className={cn(
        "w-[208px] rounded-lg border bg-card px-3 py-2.5 text-left shadow-sm transition-shadow",
        selected && "shadow-md ring-1 ring-ring",
        data.kind === "dream" && "border-space-accent/40 bg-space-accent/10",
        data.kind === "dept" && "border-border bg-muted/40",
        data.kind === "agent" && "border-space-accent/30 bg-space-accent/5",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{ opacity: 0, width: 8, height: 8 }}
      />
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            "bg-muted text-muted-foreground",
            data.kind === "agent" && "bg-space-accent/15 text-space-accent",
            data.kind === "dream" && "bg-space-accent text-space-accent-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{data.label}</span>
        {isLeaf ? (
          <Badge
            variant={data.kind === "agent" ? "accent" : "outline"}
            className="px-1.5 text-[10px]"
          >
            {kindLabel}
          </Badge>
        ) : null}
      </div>
      {data.role ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">{data.role}</p>
      ) : null}
      {isLeaf && typeof data.taskCount === "number" ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {data.taskCount} active task{data.taskCount === 1 ? "" : "s"}
        </p>
      ) : null}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{ opacity: 0, width: 8, height: 8 }}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = { org: OrgNodeCard };

function buildParentMap(nodes: OrgFlowNode[]): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const node of nodes) map.set(node.id, node.data.parentId ?? null);
  return map;
}

function computeLayout(nodes: OrgFlowNode[]): Map<string, { x: number; y: number }> {
  const parentOf = buildParentMap(nodes);
  const childrenOf = new Map<string, OrgFlowNode[]>();
  for (const node of nodes) {
    const parent = parentOf.get(node.id) ?? null;
    if (parent) {
      const list = childrenOf.get(parent) ?? [];
      list.push(node);
      childrenOf.set(parent, list);
    }
  }
  const roots = nodes.filter((node) => !parentOf.get(node.id));

  const depthOf = new Map<string, number>();
  const assignDepth = (node: OrgFlowNode, depth: number) => {
    depthOf.set(node.id, depth);
    for (const child of childrenOf.get(node.id) ?? []) assignDepth(child, depth + 1);
  };
  for (const root of roots) assignDepth(root, 0);

  let cursor = 0;
  const xOf = new Map<string, number>();
  const place = (node: OrgFlowNode): number => {
    const kids = childrenOf.get(node.id) ?? [];
    let center: number;
    if (kids.length === 0) {
      center = cursor + NODE_WIDTH / 2;
      cursor += NODE_WIDTH + H_GAP;
    } else {
      const xs = kids.map(place);
      center = (xs[0] + xs[xs.length - 1]) / 2;
    }
    xOf.set(node.id, center);
    return center;
  };
  for (const root of roots) place(root);

  const layout = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    layout.set(node.id, {
      x: (xOf.get(node.id) ?? 0) - NODE_WIDTH / 2,
      y: (depthOf.get(node.id) ?? 0) * LEVEL_HEIGHT,
    });
  }
  return layout;
}

function buildEdges(nodes: OrgFlowNode[]): Edge[] {
  return nodes
    .filter((node) => node.data.parentId)
    .map((node) => ({
      id: `e-${node.data.parentId}-${node.id}`,
      source: node.data.parentId as string,
      target: node.id,
      type: "smoothstep",
      style: { stroke: "var(--muted-foreground)", strokeWidth: 1.5 },
    }));
}

function buildFlow(): { nodes: OrgFlowNode[]; edges: Edge[] } {
  const nodes: OrgFlowNode[] = orgNodes.map((node) => ({
    id: node.id,
    type: "org",
    draggable: node.kind !== "dream",
    data: {
      label: node.label,
      kind: node.kind,
      role: node.role,
      taskCount: node.taskCount,
      skillCount: node.skills?.length ?? 0,
      parentId: node.parentId,
    },
    position: { x: 0, y: 0 },
  }));

  const layout = computeLayout(nodes);
  const positioned = nodes.map((node) => {
    const position = layout.get(node.id) ?? { x: 0, y: 0 };
    return { ...node, position };
  });

  return { nodes: positioned, edges: buildEdges(positioned) };
}

const LEGEND: { kind: OrgKind; color: string }[] = [
  { kind: "dream", color: "#8b5cf6" },
  { kind: "manager", color: "#52525b" },
  { kind: "dept", color: "#a1a1aa" },
  { kind: "human", color: "#0ea5e9" },
  { kind: "agent", color: "#10b981" },
];

function Legend() {
  return (
    <Panel
      position="top-left"
      className="pointer-events-none rounded-lg border border-border bg-card/80 p-2 backdrop-blur"
    >
      <ul className="flex flex-col gap-1">
        {LEGEND.map((item) => (
          <li key={item.kind} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {KIND_LABEL[item.kind]}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function OrgChart() {
  return (
    <ReactFlowProvider>
      <OrgChartInner />
    </ReactFlowProvider>
  );
}

function OrgChartInner() {
  const initial = useMemo(() => buildFlow(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<OrgFlowNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ChangeRequest | null>(null);
  const { getIntersectingNodes } = useReactFlow<OrgFlowNode>();

  const selectedOrg = selectedId
    ? (orgNodes.find((node) => node.id === selectedId) ?? null)
    : null;

  const parentOf = useMemo(() => buildParentMap(nodes), [nodes]);

  const isDescendant = useCallback(
    (ancestorId: string, id: string) => {
      let cursor: string | null = parentOf.get(id) ?? null;
      while (cursor) {
        if (cursor === ancestorId) return true;
        cursor = parentOf.get(cursor) ?? null;
      }
      return false;
    },
    [parentOf],
  );

  const depthOf = useCallback(
    (id: string) => {
      let depth = 0;
      let cursor: string | null = parentOf.get(id) ?? null;
      while (cursor) {
        depth += 1;
        cursor = parentOf.get(cursor) ?? null;
      }
      return depth;
    },
    [parentOf],
  );

  const handleDragStop: OnNodeDrag<OrgFlowNode> = useCallback(
    (_event, node) => {
      const rect = {
        x: node.position.x,
        y: node.position.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      };
      const candidates = getIntersectingNodes(rect, true).filter((candidate) => {
        if (candidate.id === node.id) return false;
        if (isDescendant(node.id, candidate.id)) return false;
        return (
          candidate.data.kind === "dream" ||
          candidate.data.kind === "manager" ||
          candidate.data.kind === "dept"
        );
      });
      if (candidates.length === 0) return;
      const target = candidates.reduce((best, candidate) =>
        depthOf(candidate.id) > depthOf(best.id) ? candidate : best,
      );
      const currentParent = node.data.parentId ?? null;
      if (target.id !== currentParent) {
        setProposal({
          nodeId: node.id,
          nodeLabel: node.data.label,
          newParentId: target.id,
          newParentLabel: target.data.label,
        });
      }
    },
    [getIntersectingNodes, isDescendant, depthOf],
  );

  const confirmProposal = useCallback(() => {
    if (!proposal) return;
    const updated = nodes.map((node) =>
      node.id === proposal.nodeId
        ? { ...node, data: { ...node.data, parentId: proposal.newParentId } }
        : node,
    );
    const layout = computeLayout(updated);
    const repositioned = updated.map((node) => {
      const position = layout.get(node.id) ?? node.position;
      return { ...node, position };
    });
    setNodes(repositioned);
    setEdges(buildEdges(updated));
    setProposal(null);
  }, [proposal, nodes, setNodes, setEdges]);

  const cancelProposal = useCallback(() => setProposal(null), []);

  return (
    <div className="relative h-full w-full">
      <ReactFlow<OrgFlowNode, Edge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_event, node) => setSelectedId(node.id)}
        onNodeDragStop={handleDragStop}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.35}
        maxZoom={1.75}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        <Controls />
        <MiniMap
          nodeColor={(node) => MINIMAP_COLORS[(node.data as OrgNodeData).kind]}
          nodeStrokeColor="var(--border)"
          bgColor="var(--card)"
          maskColor="var(--background)"
        />
        <Legend />
      </ReactFlow>

      <AnimatePresence>
        {selectedOrg ? (
          <NodeDrawer key="drawer" node={selectedOrg} onClose={() => setSelectedId(null)} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {proposal ? (
          <ChangeProposal
            key="proposal"
            proposal={proposal}
            onConfirm={confirmProposal}
            onCancel={cancelProposal}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
