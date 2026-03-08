export type VisualAsset = {
  src: string
  alt: string
}

// Return placeholder visual assets for DSA levels.
// These will point at /lessons/visuals/*.png under /public as you described.
export function getDsaVisuals(levelno: number): VisualAsset[] {
  switch (levelno) {
    case 1:
      return [
        { src: "/lessons/visuals/array1.png", alt: "Array visualization 1" },
        { src: "/lessons/visuals/array2.png", alt: "Array visualization 2" },
      ]
    case 2:
      return [
        { src: "/lessons/visuals/linkedlist1.png", alt: "Linked list visualization 1" },
        { src: "/lessons/visuals/linkedlist2.png", alt: "Linked list visualization 2" },
      ]
    case 3:
      return [
        { src: "/lessons/visuals/stack1.png", alt: "Stack visualization 1" },
        { src: "/lessons/visuals/stack2.png", alt: "Stack visualization 2" },
      ]
    case 4:
      return [
        { src: "/lessons/visuals/queue1.png", alt: "Queue visualization 1" },
        { src: "/lessons/visuals/queue2.png", alt: "Queue visualization 2" },
      ]
    case 5:
      return [
        { src: "/lessons/visuals/tree1.png", alt: "Tree visualization 1" },
        { src: "/lessons/visuals/tree2.png", alt: "Tree visualization 2" },
      ]
    case 6:
      return [
        { src: "/lessons/visuals/graph1.png", alt: "Graph visualization 1" },
        { src: "/lessons/visuals/graph2.png", alt: "Graph visualization 2" },
      ]
    case 7:
      return [
        { src: "/lessons/visuals/hashtable1.png", alt: "Hash table visualization 1" },
        { src: "/lessons/visuals/hashtable2.png", alt: "Hash table visualization 2" },
      ]
    case 8:
      return [
        { src: "/lessons/visuals/heap1.png", alt: "Heap visualization 1" },
        { src: "/lessons/visuals/heap2.png", alt: "Heap visualization 2" },
      ]
    default:
      return []
  }
}
